const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { catalogItems } = require('../config/catalog');

// Catalog main page - accessed via /dashboard/catalog
router.get('/', isAuthenticated, (req, res) => {
  res.redirect('/dashboard/catalog');
});

// Mount this at /dashboard prefix in app.js
module.exports = router;

// We'll add catalog routes directly to dashboard routes
