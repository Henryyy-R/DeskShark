const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  skills: [{ 
    type: String, 
    required: true 
  }], 
  activeTickets: { 
    type: Number, 
    default: 0 
  }, 
  maxCapacity: { 
    type: Number, 
    default: 10 
  },   
  performanceScore: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 100 
  } 
});

module.exports = mongoose.model('Technician', technicianSchema);