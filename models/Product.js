const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  catalogItemId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  sellerPrice: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  logoUrl: {
    type: String,
    default: ''
  },
  logoPosition: {
    type: String,
    enum: ['front', 'back', 'left', 'right'],
    default: 'front'
  },
  baseImage: {
    type: String,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
