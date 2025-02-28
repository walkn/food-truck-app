import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  addOrder as fbAddOrder, 
  updateOrder as fbUpdateOrder, 
  deleteOrder as fbDeleteOrder, 
  subscribeToOrders
} from '../firebase/firestore';
import { calculateDailySummary, getDateRanges } from '../utils/orderSummaryUtils';

const OrdersContext = createContext();

export const useOrders = () => useContext(OrdersContext);

export const OrdersProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState({
    items: [],
    customerName: '',
    total: 0,
    tps: 0,
    tvq: 0,
    totalWithTax: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applyTaxes, setApplyTaxes] = useState(false); // Default to no taxes

  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null
  });
  const [orderSummary, setOrderSummary] = useState({
    summaryByDate: [],
    overallSummary: {
      totalAmount: 0,
      orderCount: 0,
      itemsSold: []
    }
  });

  // Quebec tax rates
  const TPS_RATE = 0.05; // 5% Federal tax
  const TVQ_RATE = 0.09975; // 9.975% Quebec provincial tax

// In OrdersContext.js, the toggleTaxes function needs to be fixed

const toggleTaxes = () => {
  // Toggle the tax state first
  setApplyTaxes(prev => !prev);
  
  // Then immediately use the NEW value (not the old state) to calculate taxes
  setCurrentOrder(prevOrder => {
    // We need to explicitly pass the new tax status here, since the state update above
    // won't be reflected yet in the applyTaxes variable
    const shouldApplyTaxes = !applyTaxes; // This is the new value after toggling
    
    const subtotal = prevOrder.total; // The subtotal stays the same
    let tps = 0;
    let tvq = 0;
    let totalWithTax = subtotal;
    
    if (shouldApplyTaxes) {
      // Calculate taxes if we're applying them
      tps = subtotal * TPS_RATE;
      tvq = (subtotal + tps) * TVQ_RATE;
      totalWithTax = subtotal + tps + tvq;
    }
    
    return {
      ...prevOrder,
      tps: parseFloat(tps.toFixed(2)),
      tvq: parseFloat(tvq.toFixed(2)),
      totalWithTax: parseFloat(totalWithTax.toFixed(2)),
    };
  });
};

  // Subscribe to orders when component mounts
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = subscribeToOrders((newOrders) => {
      setOrders(newOrders);
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Calculate order summary whenever orders or date filter changes
  useEffect(() => {
    if (!loading) {
      const summary = calculateDailySummary(
        orders,
        dateFilter.startDate,
        dateFilter.endDate
      );
      setOrderSummary(summary);
    }
  }, [orders, dateFilter, loading]);

  // Calculate totals with Quebec taxes (TPS & TVQ)
  const calculateTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // If taxes are disabled, return only subtotal
  if (!applyTaxes) {
    return {
      total: parseFloat(subtotal.toFixed(2)),
      tps: 0,
      tvq: 0,
      totalWithTax: parseFloat(subtotal.toFixed(2)),
    };
  }
  
  // Otherwise calculate with taxes
  const tps = subtotal * TPS_RATE;
  const tvq = (subtotal + tps) * TVQ_RATE; // TVQ applies to price + TPS
  const totalWithTax = subtotal + tps + tvq;
  
  return {
    total: parseFloat(subtotal.toFixed(2)),
    tps: parseFloat(tps.toFixed(2)),
    tvq: parseFloat(tvq.toFixed(2)),
    totalWithTax: parseFloat(totalWithTax.toFixed(2)),
  };
};

  // Add item to current order
  const addItem = (item) => {
    setCurrentOrder(prevOrder => {
      const existingItemIndex = prevOrder.items.findIndex(i => i.id === item.id);
      let updatedItems;

      if (existingItemIndex > -1) {
        // If item already exists in order, increment quantity
        updatedItems = [...prevOrder.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
      } else {
        // Add new item with quantity 1
        updatedItems = [...prevOrder.items, { ...item, quantity: 1 }];
      }

      const { total, tps, tvq, totalWithTax } = calculateTotals(updatedItems);

      return {
        ...prevOrder,
        items: updatedItems,
        total,
        tps,
        tvq,
        totalWithTax,
      };
    });
  };

  // Remove item from current order
  const removeItem = (itemId) => {
    setCurrentOrder(prevOrder => {
      const existingItemIndex = prevOrder.items.findIndex(i => i.id === itemId);
      
      if (existingItemIndex === -1) return prevOrder;

      let updatedItems;
      
      if (prevOrder.items[existingItemIndex].quantity > 1) {
        // Decrement quantity if more than 1
        updatedItems = [...prevOrder.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity - 1
        };
      } else {
        // Remove item completely if quantity is 1
        updatedItems = prevOrder.items.filter(i => i.id !== itemId);
      }

      const { total, tps, tvq, totalWithTax } = calculateTotals(updatedItems);

      return {
        ...prevOrder,
        items: updatedItems,
        total,
        tps,
        tvq,
        totalWithTax,
      };
    });
  };

  // Clear all items from current order
  const clearOrder = () => {
    setCurrentOrder({
      items: [],
      customerName: '',
      total: 0,
      tps: 0,
      tvq: 0,
      totalWithTax: 0,
    });
  };

  // Update date filter for order summary
  const updateDateFilter = (startDate, endDate) => {
    setDateFilter({
      startDate,
      endDate
    });
  };

  // Update customer name
  const updateCustomerName = (name) => {
    setCurrentOrder(prevOrder => ({
      ...prevOrder,
      customerName: name,
    }));
  };

  // Complete current order and add to Firestore
  const completeOrder = async () => {
    if (currentOrder.items.length === 0) return { success: false, error: 'No items in order' };

    setError(null);
    
    try {
      const orderToSave = {
        ...currentOrder,
        applyTaxes: applyTaxes, // Save the tax status with the order
        timestamp: new Date().toISOString(),
      };

      const { id, error } = await fbAddOrder(orderToSave);
      
      if (error) {
        setError(error);
        return { success: false, error };
      }
      
      clearOrder();
      return { success: true, id };
    } catch (err) {
      const errorMsg = err.message || 'Failed to complete order';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Delete an order from Firestore
  const deleteOrderFromFirestore = async (orderId) => {
    setError(null);
    
    try {
      const { success, error } = await fbDeleteOrder(orderId);
      
      if (error) {
        setError(error);
        return { success: false, error };
      }
      
      return { success: true };
    } catch (err) {
      const errorMsg = err.message || 'Failed to delete order';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Load an order for editing
  const loadOrderForEditing = (orderId) => {
    const orderToEdit = orders.find(order => order.id === orderId);
    if (orderToEdit) {
      // Create a clean version of the order for editing
      const cleanOrder = {
        items: orderToEdit.items || [],
        customerName: orderToEdit.customerName || '',
        total: orderToEdit.total || 0,
        tps: orderToEdit.tps || 0,
        tvq: orderToEdit.tvq || 0,
        totalWithTax: orderToEdit.totalWithTax || 0,
        originalId: orderId // Keep track of original ID for potential updates later
      };
      
      // Set tax status based on the order
      setApplyTaxes(!!orderToEdit.applyTaxes);
      
      setCurrentOrder(cleanOrder);
      return true;
    }
    return false;
  };

  // Update an existing order
  const updateExistingOrder = async (orderId, updatedOrder) => {
    setError(null);
    
    try {
      const orderToUpdate = {
        ...updatedOrder,
        applyTaxes: applyTaxes, // Include current tax status
      };
      
      const { success, error } = await fbUpdateOrder(orderId, orderToUpdate);
      
      if (error) {
        setError(error);
        return { success: false, error };
      }
      
      return { success: true };
    } catch (err) {
      const errorMsg = err.message || 'Failed to update order';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  // Filter orders based on search term
  const filterOrders = (filterTerm) => {
    if (!filterTerm) return orders;

    const lowerFilterTerm = filterTerm.toLowerCase();
    
    return orders.filter(order => 
      order.customerName?.toLowerCase().includes(lowerFilterTerm) ||
      order.items?.some(item => item.name?.toLowerCase().includes(lowerFilterTerm))
    );
  };

  // Edit order handler that combines load and update
  const editOrder = async (orderId) => {
    // If order has an originalId, it means we're updating an existing order
    if (currentOrder.originalId) {
      const orderToUpdate = {
        ...currentOrder,
        updatedAt: new Date().toISOString(),
      };
      
      // Remove the originalId before saving
      delete orderToUpdate.originalId;
      
      const result = await updateExistingOrder(orderId, orderToUpdate);
      if (result.success) {
        clearOrder();
      }
      return result;
    }
    
    // Otherwise just load the order for editing
    const success = loadOrderForEditing(orderId);
    return { success };  // Return an object with success property
  };

  const value = {
    orders,
    currentOrder,
    loading,
    error,
    addItem,
    removeItem,
    clearOrder,
    updateCustomerName,
    completeOrder,
    deleteOrder: deleteOrderFromFirestore,
    editOrder,
    loadOrderForEditing,
    filterOrders,
    dateFilter,
    updateDateFilter,
    orderSummary,
    applyTaxes,
    toggleTaxes
  };

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
};