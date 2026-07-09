import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  addOrder as fbAddOrder,
  anonymizeExpiredCustomers,
  restoreOrder as fbRestoreOrder,
  saveMenuItem as fbSaveMenuItem,
  softDeleteOrder as fbSoftDeleteOrder,
  subscribeToMenu,
  subscribeToOrders,
  updateOrder as fbUpdateOrder,
} from '../firebase/firestore';
import defaultMenuItems from '../data/menuItems';
import { calculateDailySummary } from '../utils/orderSummaryUtils';
import {
  calculateTotals,
  normalizeOrder,
} from '../utils/orderCalculations';

const OrdersContext = createContext(null);
const DRAFT_KEY = 'timbit-order-draft-v2';
const EMPTY_ORDER = {
  items: [],
  customerName: '',
  notes: '',
  paymentMethod: 'cash',
  total: 0,
  tps: 0,
  tvq: 0,
  totalWithTax: 0,
};

const readDraft = () => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved ? { ...EMPTY_ORDER, ...JSON.parse(saved) } : EMPTY_ORDER;
  } catch {
    return EMPTY_ORDER;
  }
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used inside OrdersProvider');
  }
  return context;
};

export const OrdersProvider = ({ children }) => {
  const [allOrders, setAllOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(readDraft);
  const [menuItems, setMenuItems] = useState(defaultMenuItems);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [applyTaxes, setApplyTaxes] = useState(
    () => Boolean(readDraft().applyTaxes)
  );
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null,
  });

  const orders = useMemo(
    () => allOrders.filter((order) => !order.deletedAt),
    [allOrders]
  );
  const deletedOrders = useMemo(
    () => allOrders.filter((order) => Boolean(order.deletedAt)),
    [allOrders]
  );

  const reportableOrders = useMemo(
    () => orders.filter((order) => order.status !== 'cancelled'),
    [orders]
  );
  const orderSummary = useMemo(
    () =>
      calculateDailySummary(
        reportableOrders,
        dateFilter.startDate,
        dateFilter.endDate
      ),
    [reportableOrders, dateFilter]
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNotice('Connection restored. Changes can be saved again.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setNotice('You are offline. Your current order is saved on this device.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...currentOrder, applyTaxes })
    );
  }, [currentOrder, applyTaxes]);

  useEffect(() => {
    const unsubscribeOrders = subscribeToOrders(
      (newOrders, fromCache) => {
        setAllOrders(newOrders);
        setUsingCachedData(fromCache);
        setLoading(false);
        setError(null);
      },
      (subscriptionError) => {
        setError(`Orders could not be loaded: ${subscriptionError.message}`);
        setLoading(false);
      }
    );
    const unsubscribeMenu = subscribeToMenu(
      (remoteItems) => {
        const overrides = new Map(
          remoteItems.map((item) => [Number(item.id), item])
        );
        setMenuItems(
          defaultMenuItems.map((item) => ({
            ...item,
            ...(overrides.get(item.id) || {}),
          }))
        );
        setMenuLoading(false);
      },
      (menuError) => {
        setError(`Menu updates could not be loaded: ${menuError.message}`);
        setMenuLoading(false);
      }
    );

    return () => {
      unsubscribeOrders();
      unsubscribeMenu();
    };
  }, []);

  useEffect(() => {
    if (
      process.env.NODE_ENV === 'production' &&
      !loading &&
      orders.length > 0
    ) {
      anonymizeExpiredCustomers();
    }
  }, [loading, orders.length]);

  const recalculateOrder = useCallback(
    (order, items = order.items, taxes = applyTaxes) => ({
      ...order,
      items,
      ...calculateTotals(items, taxes),
    }),
    [applyTaxes]
  );

  const addItem = useCallback(
    (item) => {
      if (item.soldOut) return;
      setCurrentOrder((previous) => {
        const match = previous.items.find(
          (currentItem) => currentItem.id === item.id
        );
        const items = match
          ? previous.items.map((currentItem) =>
              currentItem.id === item.id
                ? { ...currentItem, quantity: currentItem.quantity + 1 }
                : currentItem
            )
          : [
              ...previous.items,
              { ...item, quantity: 1, delivered: false },
            ];
        return recalculateOrder(previous, items);
      });
    },
    [recalculateOrder]
  );

  const removeItem = useCallback(
    (itemId) => {
      setCurrentOrder((previous) => {
        const item = previous.items.find(
          (currentItem) => currentItem.id === itemId
        );
        if (!item) return previous;
        const items =
          item.quantity > 1
            ? previous.items.map((currentItem) =>
                currentItem.id === itemId
                  ? { ...currentItem, quantity: currentItem.quantity - 1 }
                  : currentItem
              )
            : previous.items.filter(
                (currentItem) => currentItem.id !== itemId
              );
        return recalculateOrder(previous, items);
      });
    },
    [recalculateOrder]
  );

  const clearOrder = useCallback(() => {
    setCurrentOrder(EMPTY_ORDER);
    setApplyTaxes(false);
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  const updateOrderField = useCallback((field, value) => {
    setCurrentOrder((previous) => ({
      ...previous,
      [field]: value,
    }));
  }, []);

  const toggleTaxes = useCallback(() => {
    const nextTaxState = !applyTaxes;
    setApplyTaxes(nextTaxState);
    setCurrentOrder((previousOrder) =>
      recalculateOrder(
        previousOrder,
        previousOrder.items,
        nextTaxState
      )
    );
  }, [applyTaxes, recalculateOrder]);

  const saveOrder = useCallback(async () => {
    if (saving) return { success: false, error: 'Save already in progress' };
    if (currentOrder.items.length === 0) {
      setError('Select at least one menu item before saving.');
      return { success: false, error: 'No items in order' };
    }
    if (!isOnline) {
      setError('You are offline. Reconnect to save this order.');
      return { success: false, error: 'Offline' };
    }

    setSaving(true);
    setError(null);
    const normalized = normalizeOrder({
      ...currentOrder,
      applyTaxes,
      status: currentOrder.status || 'new',
      completed: currentOrder.status === 'delivered',
    });
    const orderPayload = {
      customerName: normalized.customerName,
      notes: normalized.notes,
      paymentMethod: normalized.paymentMethod,
      status: normalized.status,
      items: normalized.items,
      applyTaxes: Boolean(applyTaxes),
      completed: normalized.status === 'delivered',
      total: Number(normalized.total),
      tps: Number(normalized.tps),
      tvq: Number(normalized.tvq),
      totalWithTax: Number(normalized.totalWithTax),
    };

    const result = currentOrder.originalId
      ? await fbUpdateOrder(
          currentOrder.originalId,
          orderPayload,
          'order-edited'
        )
      : await fbAddOrder(orderPayload);

    setSaving(false);
    if (!result.success && result.error) {
      setError(`Order could not be saved: ${result.error}`);
      return result;
    }

    const orderLabel = result.orderNumber
      ? `Order #${result.orderNumber}`
      : 'Order';
    setNotice(`${orderLabel} saved successfully.`);
    clearOrder();
    return { success: true, ...result };
  }, [applyTaxes, clearOrder, currentOrder, isOnline, saving]);

  const editOrder = useCallback(
    (orderId) => {
      const order = orders.find((candidate) => candidate.id === orderId);
      if (!order) return { success: false, error: 'Order not found' };
      const normalized = normalizeOrder(order);
      setApplyTaxes(Boolean(order.applyTaxes));
      setCurrentOrder({
        ...normalized,
        originalId: order.id,
      });
      setNotice(`Order #${order.orderNumber || order.id} is ready to edit.`);
      return { success: true };
    },
    [orders]
  );

  const deleteOrder = useCallback(async (orderId) => {
    const result = await fbSoftDeleteOrder(orderId);
    if (result.error) setError(`Order could not be deleted: ${result.error}`);
    else setNotice('Order moved to Recently Deleted.');
    return result;
  }, []);

  const restoreOrder = useCallback(async (orderId) => {
    const result = await fbRestoreOrder(orderId);
    if (result.error) setError(`Order could not be restored: ${result.error}`);
    else setNotice('Order restored.');
    return result;
  }, []);

  const updateOrderStatus = useCallback(
    async (orderId, status) => {
      const order = orders.find((candidate) => candidate.id === orderId);
      if (!order) return { success: false, error: 'Order not found' };
      const delivered = status === 'delivered';
      const items = delivered
        ? order.items.map((item) => ({ ...item, delivered: true }))
        : order.items;
      const result = await fbUpdateOrder(
        orderId,
        {
          status,
          completed: delivered,
          completedAt: delivered ? new Date().toISOString() : null,
          items,
        },
        'status-changed'
      );
      if (result.error) setError(`Status could not be changed: ${result.error}`);
      return result;
    },
    [orders]
  );

  const updateItemDeliveryStatus = useCallback(
    async (orderId, itemIndex, isDelivered) => {
      const order = orders.find((candidate) => candidate.id === orderId);
      if (!order) return { success: false, error: 'Order not found' };
      const items = order.items.map((item, index) =>
        index === itemIndex ? { ...item, delivered: isDelivered } : item
      );
      const allDelivered = items.every((item) => item.delivered);
      return fbUpdateOrder(
        orderId,
        {
          items,
          status: allDelivered ? 'delivered' : order.status,
          completed: allDelivered,
          completedAt: allDelivered ? new Date().toISOString() : null,
        },
        'item-delivery-changed'
      );
    },
    [orders]
  );

  const updateMenuItem = useCallback(async (item) => {
    const result = await fbSaveMenuItem(item);
    if (result.error) setError(`Menu item could not be saved: ${result.error}`);
    else setNotice(`${item.name} updated.`);
    return result;
  }, []);

  const filterOrders = useCallback(
    (filterTerm) => {
      const term = filterTerm.trim().toLowerCase();
      if (!term) return orders;
      return orders.filter(
        (order) =>
          String(order.orderNumber || order.id)
            .toLowerCase()
            .includes(term) ||
          order.customerName?.toLowerCase().includes(term) ||
          order.items?.some((item) =>
            item.name?.toLowerCase().includes(term)
          )
      );
    },
    [orders]
  );

  const value = useMemo(
    () => ({
      orders,
      deletedOrders,
      currentOrder,
      menuItems,
      loading,
      menuLoading,
      saving,
      error,
      notice,
      isOnline,
      usingCachedData,
      applyTaxes,
      dateFilter,
      orderSummary,
      addItem,
      removeItem,
      clearOrder,
      updateCustomerName: (value) => updateOrderField('customerName', value),
      updateNotes: (value) => updateOrderField('notes', value),
      updatePaymentMethod: (value) =>
        updateOrderField('paymentMethod', value),
      toggleTaxes,
      completeOrder: saveOrder,
      saveOrder,
      editOrder,
      deleteOrder,
      restoreOrder,
      updateOrderStatus,
      updateItemDeliveryStatus,
      updateMenuItem,
      filterOrders,
      updateDateFilter: (startDate, endDate) =>
        setDateFilter({ startDate, endDate }),
      dismissError: () => setError(null),
      dismissNotice: () => setNotice(null),
    }),
    [
      addItem,
      applyTaxes,
      clearOrder,
      currentOrder,
      dateFilter,
      deleteOrder,
      deletedOrders,
      editOrder,
      error,
      filterOrders,
      isOnline,
      loading,
      menuItems,
      menuLoading,
      notice,
      orderSummary,
      orders,
      removeItem,
      restoreOrder,
      saveOrder,
      saving,
      toggleTaxes,
      updateItemDeliveryStatus,
      updateMenuItem,
      updateOrderField,
      updateOrderStatus,
      usingCachedData,
    ]
  );

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
};
