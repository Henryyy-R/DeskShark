const Ticket = require('../models/Ticket');
const Technician = require('../models/Technician');
const { calculatePriority } = require('../utils/priorityCalculator'); 
const { calculateSLADates } = require('../utils/slaCalculator'); 
const { assignTechnician } = require('../utils/assignmentEngine');
const { calculatePerformanceScore } = require('../utils/performanceCalculator');
const mongoose = require('mongoose');

// ==========================================
// CREATE TICKET (Sections 7.1, 7.2, 7.4)
// ==========================================
const createTicket = async (req, res) => {
  try {
    const { title, description, category, impact, urgency, affectedUsers } = req.body;
    
    // 1. Calculate Priority
    const { level, score } = calculatePriority(impact, urgency, affectedUsers);

    // 2. Calculate SLA Dates
    const { responseDue, resolutionDue } = calculateSLADates(level);

    // 3. Technician Assignment Pipeline
    const availableTechnicians = await Technician.find().lean();
    const assignmentResult = assignTechnician(category, availableTechnicians);

    const generateTicketNumber = `TKT-${Math.floor(Math.random() * 100000)}`; 
    const fakeUserId = new mongoose.Types.ObjectId(); 

    // 4. Build the ticket
    const newTicket = new Ticket({
      title,
      description,
      category,
      impact,
      urgency,
      priority: level,         
      priorityScore: score,    
      affectedUsers,
      assignedTechnicianId: assignmentResult.technicianId, 
      assignmentNote: assignmentResult.flag,               
      ticketNumber: generateTicketNumber,
      requesterId: fakeUserId,
      slaResponseDue: responseDue,    
      slaResolutionDue: resolutionDue 
    });

    const savedTicket = await newTicket.save();
    res.status(201).json(savedTicket);
    
  } catch (error) {
    res.status(500).json({ message: "Failed to create ticket", error: error.message });
  }
};

// ==========================================
// RESOLVE TICKET (Section 7.5)
// ==========================================
const resolveTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;

    // 1. Find the ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.status === 'Resolved') return res.status(400).json({ message: 'Ticket is already resolved.' });

    // 2. Mark ticket as resolved and stop the SLA clock
    ticket.status = 'Resolved';
    ticket.resolvedAt = new Date();
    await ticket.save();

    // 3. Algorithm 7.5: Regrade the Technician
    const technician = await Technician.findById(ticket.assignedTechnicianId);
    if (technician) {
      technician.activeTickets -= 1; // Free up their workload capacity
      technician.performanceScore = calculatePerformanceScore(
        80, // Mock: Lifetime resolved tickets
        4.7, // Mock: Average customer rating
        100  // Mock: SLA compliance %
      );
      await technician.save();
    }

    res.status(200).json({ message: 'Ticket successfully resolved.', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error while resolving ticket.' });
  }
};

// ==========================================
// GET ALL TICKETS (For the Dashboard)
// ==========================================
const getTickets = async (req, res) => {
  try {
    // We use .populate() to grab the actual technician's name instead of just their ID
    const tickets = await Ticket.find()
      .populate('assignedTechnicianId', 'name email')
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching tickets.', error: error.message });
  }
};

// ==========================================
// GET A SINGLE TICKET BY ID
// ==========================================
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('assignedTechnicianId', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching ticket.', error: error.message });
  }
};

// Export BOTH functions
module.exports = {
  createTicket,
  resolveTicket,
  getTickets,    
  getTicketById
};