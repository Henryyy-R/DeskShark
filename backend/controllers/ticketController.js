const Ticket = require('../models/Ticket');
const { calculatePriority } = require('../utils/priorityCalculator'); 
const { calculateSLADates } = require('../utils/slaCalculator'); // <-- ADD THIS LINE
const mongoose = require('mongoose');

const createTicket = async (req, res) => {
  try {
    const { title, description, category, impact, urgency, affectedUsers } = req.body;
    
    // 1. Unpack BOTH the string level and the numerical score from the calculator
    const { level, score } = calculatePriority(impact, urgency, affectedUsers);

    // 2. Calculate SLA Dates using the new Priority level
    const { responseDue, resolutionDue } = calculateSLADates(level);

    // --- TEMPORARY MOCK DATA (We only need fake IDs now, no more fake dates!) ---
    const generateTicketNumber = `TKT-${Math.floor(Math.random() * 100000)}`; 
    const fakeUserId = new mongoose.Types.ObjectId(); 

    // 3. Build the ticket
    const newTicket = new Ticket({
      title,
      description,
      category,
      impact,
      urgency,
      priority: level,         
      priorityScore: score,    
      affectedUsers,
      ticketNumber: generateTicketNumber,
      requesterId: fakeUserId,
      slaResponseDue: responseDue,    // <-- Uses the real calculated time
      slaResolutionDue: resolutionDue // <-- Uses the real calculated time
    });

    // Save to MongoDB
    const savedTicket = await newTicket.save();
    
    // Return the successful ticket
    res.status(201).json(savedTicket);
    
  } catch (error) {
    res.status(500).json({ message: "Failed to create ticket", error: error.message });
  }
};

module.exports = {
  createTicket
};