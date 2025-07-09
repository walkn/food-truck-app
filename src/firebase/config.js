import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// Replace these placeholder values with your actual Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyAxH0UPEux0IBgwGXHlpcDQua2FxftrtGo",
    authDomain: "food-truck-vietnam-729ef.firebaseapp.com",
    projectId: "food-truck-vietnam-729ef",
    storageBucket: "food-truck-vietnam-729ef.firebasestorage.app",
    messagingSenderId: "462408351370",
    appId: "1:462408351370:web:0250420ebac4ae6cc9b773",
    measurementId: "G-SWNXQCHHRQ"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { db, auth };