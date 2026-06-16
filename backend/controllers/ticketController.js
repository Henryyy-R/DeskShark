const Ticket = require('../models/Ticket');
const { calculatePriority } = require('../utils/priorityCalculator'); 
const mongoose = require('mongoose'); // Added to generate a fake User ID

const createTicket = async (req, res) => {
  try {
    const { title, description, category, impact, urgency, affectedUsers } = req.body;
    
    // 1. Unpack BOTH the string level and the numerical score from the calculator
    const { level, score } = calculatePriority(impact, urgency, affectedUsers);

    // --- TEMPORARY MOCK DATA TO SATISFY DATABASE VALIDATION ---
    const generateTicketNumber = `TKT-${Math.floor(Math.random() * 100000)}`; // e.g., TKT-48912
    const fakeUserId = new mongoose.Types.ObjectId(); // A valid-looking MongoDB ID
    
    const now = new Date();
    const fakeResponseDue = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const fakeResolutionDue = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // 2. Build the ticket with ALL required fields, including the new priorityScore
    const newTicket = new Ticket({
      title,
      description,
      category,
      impact,
      urgency,
      priority: level,         // The string label (e.g., 'Critical')
      priorityScore: score,    // The exact calculated number (e.g., 71)
      affectedUsers,
      ticketNumber: generateTicketNumber,
      requesterId: fakeUserId,
      slaResponseDue: fakeResponseDue,
      slaResolutionDue: fakeResolutionDue
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