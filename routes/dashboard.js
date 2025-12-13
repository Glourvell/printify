const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { catalogItems } = require('../config/catalog');

// Dashboard home - redirect to catalog
router.get('/', isAuthenticated, (req, res) => {
  res.redirect('/dashboard/catalog');
});

// Profile page
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    res.render('pages/dashboard', {
      user: req.session.user,
      page: 'profile',
      userData: user,
      data: {}
    });
  } catch (error) {
    res.render('pages/error', { message: 'Error loading profile' });
  }
});

// Update profile
router.post('/profile/update', isAuthenticated, async (req, res) => {
  try {
    const { displayName } = req.body;
    await User.findByIdAndUpdate(req.session.user.id, { displayName });
    req.session.user.displayName = displayName;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Catalog page
router.get('/catalog', isAuthenticated, (req, res) => {
  res.render('pages/dashboard', {
    user: req.session.user,
    page: 'catalog',
    data: { catalogItems }
  });
});

// Customize product page
router.get('/catalog/customize/:itemId', isAuthenticated, (req, res) => {
  const { itemId } = req.params;
  let foundItem = null;
  let category = '';
  
  for (const [catKey, catData] of Object.entries(catalogItems)) {
    const item = catData.items.find(i => i.id === itemId);
    if (item) {
      foundItem = item;
      category = catKey;
      break;
    }
  }
  
  if (!foundItem) {
    return res.redirect('/dashboard/catalog');
  }
  
  res.render('pages/dashboard', {
    user: req.session.user,
    page: 'customize',
    data: { item: foundItem, category }
  });
});

// My Products page
router.get('/my-products', isAuthenticated, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.session.user.id });
    const user = await User.findById(req.session.user.id);
    const domain = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';
    
    res.render('pages/dashboard', {
      user: req.session.user,
      page: 'my-products',
      data: { 
        products,
        storeCreated: user.storeCreated,
        storeName: user.storeName,
        storeSlug: user.storeSlug,
        domain
      }
    });
  } catch (error) {
    res.render('pages/error', { message: 'Error loading products' });
  }
});

// Items Sold page
router.get('/items-sold', isAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ 
      sellerId: req.session.user.id,
      paymentStatus: 'completed'
    }).populate('productId').sort({ createdAt: -1 });
    
    res.render('pages/dashboard', {
      user: req.session.user,
      page: 'items-sold',
      data: { orders }
    });
  } catch (error) {
    res.render('pages/error', { message: 'Error loading orders' });
  }
});

module.exports = router;
