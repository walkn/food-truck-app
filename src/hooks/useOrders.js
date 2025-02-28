import { useState, useEffect } from 'react';

const useOrders = () => {
  // State for current order
  const [currentOrder, setCurrentOrder] = useState({
    items: [],
    customerName: '',
    timestamp: null,
    total: 0,
    tps: 0,
    tvq: 0,
    totalWithTax: 0,
  });

  // State for order history
  const [orderHistory, setOrderHistory] = useState([]);

  // Load order history from localStorage on component mount
  useEffect(() => {
    const savedOrderHistory = localStorage.getItem('orderHistory');
    if (savedOrderHistory) {
      setOrderHistory(JSON.parse(savedOrderHistory));
    }
  }, []);

  // Save order history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
  }, [orderHistory]);

  // Quebec tax rates
  const TPS_RATE = 0.05; // 5% Federal tax
  const TVQ_RATE = 0.09975; // 9.975% Quebec provincial tax

  // Calculate totals with Quebec taxes (TPS & TVQ)
  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
      timestamp: null,
      total: 0,
      tps: 0,
      tvq: 0,
      totalWithTax: 0,
    });
  };

  // Update customer name
  const updateCustomerName = (name) => {
    setCurrentOrder(prevOrder => ({
      ...prevOrder,
      customerName: name,
    }));
  };

  // Complete current order and add to history
  const completeOrder = () => {
    if (currentOrder.items.length === 0) return;

    const completedOrder = {
      ...currentOrder,
      id: Date.now(), // Use timestamp as unique ID
      timestamp: new Date().toISOString(),
    };

    // Add to history
    setOrderHistory(prevHistory => [completedOrder, ...prevHistory]);

    // Clear current order
    clearOrder();
  };

  // Filter order history
  const filterOrderHistory = (filterTerm) => {
    if (!filterTerm) return orderHistory;

    const lowerFilterTerm = filterTerm.toLowerCase();
    
    return orderHistory.filter(order => 
      order.customerName.toLowerCase().includes(lowerFilterTerm) ||
      order.items.some(item => item.name.toLowerCase().includes(lowerFilterTerm))
    );
  };

  // Delete an order from history
  const deleteOrder = (orderId) => {
    setOrderHistory(prevHistory => 
      prevHistory.filter(order => order.id !== orderId)
    );
  };

  // Load an order from history for editing
  const editOrder = (orderId) => {
    const orderToEdit = orderHistory.find(order => order.id === orderId);
    if (orderToEdit) {
      // Load the order into current order state
      setCurrentOrder({
        ...orderToEdit,
        // Create a new ID to avoid overwriting the original order
        id: null
      });
      
      // Remove the order being edited from history
      setOrderHistory(prevHistory => 
        prevHistory.filter(order => order.id !== orderId)
      );
      
      return true;
    }
    return false;
  };

  return {
    currentOrder,
    orderHistory,
    addItem,
    removeItem,
    clearOrder,
    updateCustomerName,
    completeOrder,
    filterOrderHistory,
    deleteOrder,
    editOrder,
  };
};

export default useOrders;