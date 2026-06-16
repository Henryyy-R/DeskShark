const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  skills: [{
    type: String // e.g., ['Network', 'Hardware', 'Software', 'Access']
  }],
  activeTickets: {
    type: Number,
    default: 0, // Used for Workload Balancing (Section 7.4)
  },
  maximumCapacity: {
    type: Number,
    default: 10, // Used for Workload Balancing (Section 7.4)
  },
  performanceScore: {
    type: Number,
    default: 100, // 0-100 scale, used for Performance Rating (Section 7.5.1)
  }
}, { timestamps: true });

module.exports = mongoose.model('Technician', technicianSchema);