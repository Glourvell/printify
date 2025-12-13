const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');

// Create store
router.post('/create', isAuthenticated, async (req, res) => {
  try {
    const { storeName } = req.body;
    
    // Create slug from store name
    const storeSlug = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if slug already exists
    const existingStore = await User.findOne({ storeSlug });
    if (existingStore && existingStore._id.toString() !== req.session.user.id) {
      return res.status(400).json({ 
        success: false, 
        error: 'This store name is already taken. Please choose another.' 
      });
    }
    
    // Update user with store info
    const user = await User.findByIdAndUpdate(
      req.session.user.id,
      { storeName, storeSlug, storeCreated: true },
      { new: true }
    );
    
    // Publish all user products
    await Product.updateMany(
      { userId: req.session.user.id },
      { isPublished: true }
    );
    
    // Update session
    req.session.user.storeName = storeName;
    req.session.user.storeSlug = storeSlug;
    req.session.user.storeCreated = true;
    
    res.json({ 
      success: true, 
      storeUrl: `/shop/${storeSlug}`,
      storeName,
      storeSlug
    });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get store info
router.get('/info', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    res.json({
      success: true,
      storeName: user.storeName,
      storeSlug: user.storeSlug,
      storeCreated: user.storeCreated
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
