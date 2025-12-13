const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    sparse: true
  },
  phone: {
    type: String,
    sparse: true
  },
  displayName: {
    type: String,
    default: 'User'
  },
  photoURL: {
    type: String,
    default: '/images/default-avatar.svg'
  },
  storeName: {
    type: String,
    unique: true,
    sparse: true
  },
  storeSlug: {
    type: String,
    unique: true,
    sparse: true
  },
  storeCreated: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
