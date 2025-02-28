import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

// Collection references
const ORDERS_COLLECTION = 'orders';

// Add a new order
export const addOrder = async (orderData) => {
  try {
    const orderToAdd = {
      ...orderData,
      createdAt: serverTimestamp(),
      deviceId: getDeviceId() // Adding a device identifier
    };
    
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), orderToAdd);
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error("Error adding order: ", error);
    return { id: null, error: error.message };
  }
};

// Update an order
export const updateOrder = async (orderId, orderData) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      ...orderData,
      updatedAt: serverTimestamp(),
      deviceId: getDeviceId() // Track which device made the update
    });
    return { success: true, error: null };
  } catch (error) {
    console.error("Error updating order: ", error);
    return { success: false, error: error.message };
  }
};

// Delete an order
export const deleteOrder = async (orderId) => {
  try {
    await deleteDoc(doc(db, ORDERS_COLLECTION, orderId));
    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting order: ", error);
    return { success: false, error: error.message };
  }
};

// Get all orders
export const getOrders = async () => {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION), 
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore timestamp to JS Date
      const timestamp = data.createdAt ? 
        new Date(data.createdAt.seconds * 1000).toISOString() : 
        new Date().toISOString();
        
      orders.push({
        id: doc.id,
        ...data,
        timestamp: timestamp
      });
    });
    
    return { orders, error: null };
  } catch (error) {
    console.error("Error getting orders: ", error);
    return { orders: [], error: error.message };
  }
};

// Subscribe to real-time updates of orders
export const subscribeToOrders = (callback) => {
  const q = query(
    collection(db, ORDERS_COLLECTION), 
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const orders = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore timestamp to JS Date
      const timestamp = data.createdAt ? 
        new Date(data.createdAt.seconds * 1000).toISOString() : 
        new Date().toISOString();
        
      orders.push({
        id: doc.id,
        ...data,
        timestamp: timestamp
      });
    });
    callback(orders);
  }, (error) => {
    console.error("Error subscribing to orders: ", error);
    callback([]);
  });
};

// Generate a unique device ID or retrieve the existing one
function getDeviceId() {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}
