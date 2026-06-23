const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium' 
  },
  priorityScore: {
    type: Number 
  },
  status: { 
    type: String, 
    enum: ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'], 
    default: 'Open' 
  },
  requesterId: { 
    type: String, 
    required: true 
},
  assignedTechnicianId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Technician', 
    default: null 
  },
  
  // Algorithmic Inputs
  impact: { type: Number, min: 1, max: 5, required: true },
  urgency: { type: Number, min: 1, max: 5, required: true },
  affectedUsers: { type: Number, min: 1, required: true },
  
  // SLA Time Metrics
  respondedAt: { type: Date, default: null },
  resolvedAt: { type: Date, default: null },
  slaResponseDue: { type: Date, required: true },
  slaResolutionDue: { type: Date, required: true },
  
  // SLA Evaluation Statuses
  slaResponseBreached: { type: Boolean, default: false },
  slaResolutionBreached: { type: Boolean, default: false },
  
  resolutionNote: { type: String, default: "" }
}, { timestamps: true }); 

module.exports = mongoose.model('Ticket', ticketSchema);