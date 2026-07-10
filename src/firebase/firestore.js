import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';

const ORDERS_COLLECTION = 'orders';
const EVENTS_COLLECTION = 'orderEvents';
const MENU_COLLECTION = 'menu';
const COUNTER_REF = doc(db, 'counters', 'orders');
const CUSTOMER_RETENTION_DAYS = 30;

export function getDeviceId() {
  let deviceId = localStorage.getItem('timbitDeviceId');
  if (!deviceId) {
    deviceId = `device_${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
    localStorage.setItem('timbitDeviceId', deviceId);
  }
  return deviceId;
}

const recordEvent = (orderId, type, details = {}) =>
  addDoc(collection(db, EVENTS_COLLECTION), {
    orderId,
    type,
    details,
    deviceId: getDeviceId(),
    createdAt: serverTimestamp(),
  });

export const addOrder = async (orderData) => {
  try {
    const orderRef = doc(collection(db, ORDERS_COLLECTION));
    let orderNumber;

    await runTransaction(db, async (transaction) => {
      const counterSnapshot = await transaction.get(COUNTER_REF);
      const currentValue = counterSnapshot.exists()
        ? Number(counterSnapshot.data().value) || 1000
        : 1000;
      orderNumber = currentValue + 1;

      transaction.set(COUNTER_REF, {
        value: orderNumber,
        updatedAt: serverTimestamp(),
      });
      transaction.set(orderRef, {
        ...orderData,
        orderNumber,
        deviceId: getDeviceId(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deletedAt: null,
      });
    });

    recordEvent(orderRef.id, 'created', { orderNumber }).catch(console.error);
    return { id: orderRef.id, orderNumber, error: null };
  } catch (error) {
    console.error('Error adding order:', error);
    return { id: null, orderNumber: null, error: error.message };
  }
};

export const updateOrder = async (orderId, orderData, eventType = 'updated') => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      ...orderData,
      updatedAt: serverTimestamp(),
      deviceId: getDeviceId(),
    });
    recordEvent(orderId, eventType).catch(console.error);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating order:', error);
    return { success: false, error: error.message };
  }
};

export const softDeleteOrder = (orderId) =>
  updateOrder(
    orderId,
    {
      deletedAt: serverTimestamp(),
      deletedBy: getDeviceId(),
    },
    'deleted'
  );

export const softDeleteOrders = async (orderIds = []) => {
  const ids = [...new Set(orderIds)].filter(Boolean);
  if (ids.length === 0) return { success: true, count: 0, error: null };

  try {
    const deviceId = getDeviceId();
    for (let start = 0; start < ids.length; start += 500) {
      const batch = writeBatch(db);
      ids.slice(start, start + 500).forEach((orderId) => {
        batch.update(doc(db, ORDERS_COLLECTION, orderId), {
          deletedAt: serverTimestamp(),
          deletedBy: deviceId,
          updatedAt: serverTimestamp(),
          deviceId,
        });
      });
      await batch.commit();
    }

    recordEvent('bulk', 'bulk-deleted', { count: ids.length }).catch(
      console.error
    );
    return { success: true, count: ids.length, error: null };
  } catch (error) {
    console.error('Error deleting orders:', error);
    return { success: false, count: 0, error: error.message };
  }
};

export const restoreOrder = (orderId) =>
  updateOrder(
    orderId,
    {
      deletedAt: null,
      deletedBy: null,
    },
    'restored'
  );

const mapOrder = (snapshot) => {
  const data = snapshot.data();
  const createdAt = data.createdAt?.toDate?.();
  return {
    id: snapshot.id,
    ...data,
    timestamp:
      createdAt?.toISOString() ||
      data.timestamp ||
      new Date().toISOString(),
  };
};

export const subscribeToOrders = (callback, onError) => {
  const ordersQuery = query(
    collection(db, ORDERS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(500)
  );

  return onSnapshot(
    ordersQuery,
    { includeMetadataChanges: true },
    (snapshot) => {
      callback(
        snapshot.docs.map(mapOrder),
        snapshot.metadata.fromCache
      );
    },
    (error) => {
      console.error('Error subscribing to orders:', error);
      onError?.(error);
    }
  );
};

export const subscribeToMenu = (callback, onError) =>
  onSnapshot(
    collection(db, MENU_COLLECTION),
    (snapshot) => {
      callback(
        snapshot.docs.map((menuDoc) => ({
          id: Number(menuDoc.id),
          ...menuDoc.data(),
        }))
      );
    },
    (error) => {
      console.error('Error subscribing to menu:', error);
      onError?.(error);
    }
  );

export const saveMenuItem = async (item) => {
  try {
    await setDoc(
      doc(db, MENU_COLLECTION, String(item.id)),
      {
        name: String(item.name).slice(0, 80),
        description: String(item.description || '').slice(0, 160),
        image: String(item.image || '').slice(0, 200),
        price: Number(item.price),
        soldOut: Boolean(item.soldOut),
        updatedAt: serverTimestamp(),
        deviceId: getDeviceId(),
      },
      { merge: true }
    );
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const anonymizeExpiredCustomers = async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CUSTOMER_RETENTION_DAYS);

  try {
    const expiredQuery = query(
      collection(db, ORDERS_COLLECTION),
      where('createdAt', '<', cutoff),
      limit(100)
    );
    const snapshot = await getDocs(expiredQuery);
    const eligible = snapshot.docs.filter((orderDoc) => {
      const data = orderDoc.data();
      return data.customerName && !data.anonymizedAt;
    });

    if (eligible.length === 0) return;

    const batch = writeBatch(db);
    eligible.forEach((orderDoc) => {
      batch.update(orderDoc.ref, {
        customerName: '',
        anonymizedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    console.warn('Customer retention cleanup could not run:', error);
  }
};
