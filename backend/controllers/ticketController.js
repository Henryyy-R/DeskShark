const Ticket = require('../models/Ticket');
const Technician = require('../models/Technician'); // <-- NEW
const { calculatePriority } = require('../utils/priorityCalculator'); 
const { calculateSLADates } = require('../utils/slaCalculator'); 
const { assignTechnician } = require('../utils/assignmentEngine'); // <-- NEW
const mongoose = require('mongoose');

const createTicket = async (req, res) => {
  try {
    const { title, description, category, impact, urgency, affectedUsers } = req.body;
    
    // 1. Calculate Priority (Section 7.2)
    const { level, score } = calculatePriority(impact, urgency, affectedUsers);

    // 2. Calculate SLA Dates
    const { responseDue, resolutionDue } = calculateSLADates(level);

    // ==========================================
    // NEW: TECHNICIAN ASSIGNMENT PIPELINE
    // ==========================================
    // Fetch all technicians from the database
    const availableTechnicians = await Technician.find().lean();
    
    // Run the Two-Stage Pipeline (Sections 7.1, 7.4, 7.5.1)
    const assignmentResult = assignTechnician(category, availableTechnicians);

    // --- TEMPORARY MOCK DATA ---
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
      assignedTechnicianId: assignmentResult.technicianId, // <-- The Winner from the Engine
      assignmentNote: assignmentResult.flag,               // <-- Tracks 'Auto-Assigned' or 'Manual Admin Assignment'
      ticketNumber: generateTicketNumber,
      requesterId: fakeUserId,
      slaResponseDue: responseDue,    
      slaResolutionDue: resolutionDue 
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