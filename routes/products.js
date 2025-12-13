const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { isAuthenticated } = require('../middleware/auth');
const Product = require('../models/Product');
const User = require('../models/User');
const { catalogItems } = require('../config/catalog');

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${uuidv4()}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Add product from catalog
router.post('/add', isAuthenticated, upload.single('logo'), async (req, res) => {
  try {
    const { catalogItemId, category, name, sellerPrice, description, logoPosition } = req.body;
    
    // Find the catalog item
    let baseItem = null;
    let subcategory = '';
    
    for (const [catKey, catData] of Object.entries(catalogItems)) {
      const item = catData.items.find(i => i.id === catalogItemId);
      if (item) {
        baseItem = item;
        subcategory = catKey;
        break;
      }
    }
    
    if (!baseItem) {
      return res.status(400).json({ success: false, error: 'Invalid catalog item' });
    }
    
    const product = new Product({
      userId: req.session.user.id,
      catalogItemId,
      name: name || baseItem.name,
      category: category || subcategory,
      subcategory,
      basePrice: baseItem.basePrice,
      sellerPrice: parseFloat(sellerPrice) || baseItem.basePrice,
      description: description || baseItem.description,
      logoUrl: req.file ? `/uploads/${req.file.filename}` : '',
      logoPosition: logoPosition || 'front',
      baseImage: baseItem.image
    });
    
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update product
router.post('/update/:id', isAuthenticated, upload.single('logo'), async (req, res) => {
  try {
    const { name, sellerPrice, description, logoPosition } = req.body;
    
    const updateData = {
      name,
      sellerPrice: parseFloat(sellerPrice),
      description,
      logoPosition
    };
    
    if (req.file) {
      updateData.logoUrl = `/uploads/${req.file.filename}`;
    }
    
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.user.id },
      updateData,
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete product
router.delete('/delete/:id', isAuthenticated, async (req, res) => {
  try {
    await Product.findOneAndDelete({ _id: req.params.id, userId: req.session.user.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Publish product
router.post('/publish/:id', isAuthenticated, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.user.id },
      { isPublished: true },
      { new: true }
    );
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
