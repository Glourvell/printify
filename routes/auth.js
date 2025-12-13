const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isNotAuthenticated } = require('../middleware/auth');

// Login/Signup page
router.get('/', isNotAuthenticated, (req, res) => {
  res.render('pages/auth', { 
    error: null,
    firebaseConfig: {
      apiKey: process.env.VITE_FIREBASE_API_KEY || '',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
      appId: process.env.VITE_FIREBASE_APP_ID || ''
    }
  });
});

// Handle Firebase auth callback
router.post('/auth/firebase', async (req, res) => {
  try {
    const { uid, email, phone, displayName, photoURL } = req.body;
    
    let user = await User.findOne({ firebaseUid: uid });
    
    if (!user) {
      user = new User({
        firebaseUid: uid,
        email: email || null,
        phone: phone || null,
        displayName: displayName || 'User',
        photoURL: photoURL || '/images/default-avatar.svg'
      });
      await user.save();
    }
    
    req.session.user = {
      id: user._id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName,
      photoURL: user.photoURL,
      storeName: user.storeName,
      storeSlug: user.storeSlug,
      storeCreated: user.storeCreated
    };
    
    res.json({ success: true, redirect: '/dashboard' });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
