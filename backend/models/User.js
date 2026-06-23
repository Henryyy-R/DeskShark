const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // FIX: was appwriteId - updated to match Clerk auth
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true
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
    enum: ['employee', 'technician', 'admin'],
    default: 'employee'
  },
  department: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
