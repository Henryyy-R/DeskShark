const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  appwriteId: {
    type: String,
    required: true,
    unique: true,
    index: true // Speeds up queries when logging in via Appwrite
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['Employee', 'Technician', 'Administrator'],
    default: 'Employee'
  },
  department: {
    type: String, // Useful for sorting tickets by user department
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);