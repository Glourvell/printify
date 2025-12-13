import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
  // apiKey: window.FIREBASE_API_KEY || '',
  // authDomain: `${window.FIREBASE_PROJECT_ID || ''}.firebaseapp.com`,
  // projectId: window.FIREBASE_PROJECT_ID || '',
  // storageBucket: `${window.FIREBASE_PROJECT_ID || ''}.appspot.com`,
  // appId: window.FIREBASE_APP_ID || ''


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
