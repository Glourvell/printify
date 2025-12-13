import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
  // apiKey: window.FIREBASE_API_KEY || '',
  // authDomain: `${window.FIREBASE_PROJECT_ID || ''}.firebaseapp.com`,
  // projectId: window.FIREBASE_PROJECT_ID || '',
  // storageBucket: `${window.FIREBASE_PROJECT_ID || ''}.appspot.com`,
  // appId: window.FIREBASE_APP_ID || ''

  apiKey: "AIzaSyCBSlddxmk_B8DoT269rrvLdtBFlUplI78",
  authDomain: "printify-ke.firebaseapp.com",
  projectId: "printify-ke",
  storageBucket: "printify-ke.firebasestorage.app",
  messagingSenderId: "691292452284",
  appId: "1:691292452284:web:98eb60d35ad13f254327b9",
  measurementId: "G-2HLKKPT1C9"
};

let app = null;
let auth = null;

if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.log('Firebase initialization error:', error.message);
  }
} else {
  console.log('Firebase not configured - credentials missing');
}

export { app, auth };
