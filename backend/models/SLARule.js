const mongoose = require('mongoose');

const slaRuleSchema = new mongoose.Schema({
  priorityLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true,
    unique: true
  },
  responseTargetMinutes: {
    type: Number,
    required: true
  },
  resolutionTargetMinutes: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('SLARule', slaRuleSchema);