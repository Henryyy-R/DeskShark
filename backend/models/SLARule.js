const mongoose = require('mongoose');

const slaRuleSchema = new mongoose.Schema({
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    required: true, 
    unique: true 
  },
  responseTime: { 
    type: Number, 
    required: true 
  }, 
  resolutionTime: { 
    type: Number, 
    required: true 
  } 
});

module.exports = mongoose.model('SLARule', slaRuleSchema);