import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
} from 'firebase/app-check';

// Your web app's Firebase configuration
// Replace these placeholder values with your actual Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyAxH0UPEux0IBgwGXHlpcDQua2FxftrtGo",
    authDomain: "food-truck-729ef.firebaseapp.com",
    projectId: "food-truck-729ef",
    storageBucket: "food-truck-729ef.firebasestorage.app",
    messagingSenderId: "462408351370",
    appId: "1:462408351370:web:0250420ebac4ae6cc9b773",
    measurementId: "G-SWNXQCHHRQ"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
const auth = getAuth(app);

const appCheckSiteKey = process.env.REACT_APP_FIREBASE_APP_CHECK_SITE_KEY;

if (appCheckSiteKey && typeof window !== 'undefined') {
  if (process.env.NODE_ENV === 'development') {
    window.FIREBASE_APPCHECK_DEBUG_TOKEN =
      process.env.REACT_APP_FIREBASE_APPCHECK_DEBUG_TOKEN || true;
  }

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export { db, auth };
