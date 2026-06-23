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
    default: 0, // Workload Balancing (Section 7.4)
  },
  maximumCapacity: {
    type: Number,
    default: 10, // Workload Balancing (Section 7.4)
  },
  performanceScore: {
    type: Number,
    default: 100, // 0-100 scale (Section 7.5)
  },
  // FIX: needed for real performance recalculation in resolveTicket
  // Placeholder until customer rating feature is built (default 4.0/5)
  averageCustomerRating: {
    type: Number,
    default: 4.0,
    min: 1,
    max: 5
  }
}, { timestamps: true });

module.exports = mongoose.model('Technician', technicianSchema);
