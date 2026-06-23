const { getAuth } = require('@clerk/express');
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
    const auth = getAuth(req);
    if (!auth.userId) {
      return res.status(401).json({ message: 'Unauthorized request' });
    }

    const { title, description, category, impact, urgency, affectedUsers } = req.body;

    // 1. Calculate Priority
    const { level, score } = calculatePriority(impact, urgency, affectedUsers);

    // 2. Calculate SLA Dates
    const { responseDue, resolutionDue } = calculateSLADates(level);

    // 3. Technician Assignment Pipeline
    const availableTechnicians = await Technician.find().lean();
    const assignmentResult = assignTechnician(category, availableTechnicians);

    // FIX #1: Generate ticket number using timestamp to avoid collisions
    const generateTicketNumber = `TKT-${Date.now()}`;

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
      requesterId: auth.userId,
      slaResponseDue: responseDue,
      slaResolutionDue: resolutionDue,
      // If a technician was assigned, set status to Assigned
      status: assignmentResult.technicianId ? 'Assigned' : 'Open'
    });

    const savedTicket = await newTicket.save();

    // FIX #2: Increment activeTickets on the assigned technician
    if (assignmentResult.technicianId) {
      await Technician.findByIdAndUpdate(
        assignmentResult.technicianId,
        { $inc: { activeTickets: 1 } }
      );
    }

    res.status(201).json(savedTicket);

  } catch (error) {
    res.status(500).json({ message: 'Failed to create ticket', error: error.message });
  }
};

// ==========================================
// RESOLVE TICKET (Section 7.5)
// ==========================================
const resolveTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.status === 'Resolved') return res.status(400).json({ message: 'Ticket is already resolved.' });

    ticket.status = 'Resolved';
    ticket.resolvedAt = new Date();
    await ticket.save();

    // FIX #3: Use real technician data for performance recalculation
    if (ticket.assignedTechnicianId) {
      const technician = await Technician.findById(ticket.assignedTechnicianId);
      if (technician) {
        // Decrement activeTickets
        technician.activeTickets = Math.max(0, technician.activeTickets - 1);

        // Count actual resolved tickets for this technician
        const resolvedCount = await Ticket.countDocuments({
          assignedTechnicianId: technician._id,
          status: 'Resolved'
        });

        // Count total tickets to calculate real SLA compliance %
        const totalTickets = await Ticket.countDocuments({
          assignedTechnicianId: technician._id,
          status: { $in: ['Resolved', 'Closed'] }
        });

        const slaCompliantTickets = await Ticket.countDocuments({
          assignedTechnicianId: technician._id,
          status: { $in: ['Resolved', 'Closed'] },
          slaResolutionBreached: false
        });

        const slaCompliancePercent = totalTickets > 0
          ? (slaCompliantTickets / totalTickets) * 100
          : 100;

        // Normalize resolvedCount to 0-100 (cap at 100)
        const resolvedNormalized = Math.min(resolvedCount, 100);

        // Customer rating: default to 4.0 until ratings feature is built
        const customerRatingRaw = technician.averageCustomerRating || 4.0;

        technician.performanceScore = calculatePerformanceScore(
          resolvedNormalized,
          customerRatingRaw,
          slaCompliancePercent
        );

        await technician.save();
      }
    }

    res.status(200).json({ message: 'Ticket successfully resolved.', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error while resolving ticket.', error: error.message });
  }
};

// ==========================================
// GET TICKETS (Employee - Only Their Own)
// ==========================================
const getTickets = async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      return res.status(401).json({ message: 'Unauthorized request' });
    }

    const tickets = await Ticket.find({ requesterId: auth.userId })
      .populate('assignedTechnicianId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching tickets.', error: error.message });
  }
};

// ==========================================
// GET ALL TICKETS (Technician/Admin only)
// ==========================================
const getAllTickets = async (req, res) => {
  try {
    const auth = getAuth(req);
    const userRole = auth.sessionClaims?.metadata?.role;

    if (!userRole || !['technician', 'admin'].includes(userRole)) {
      return res.status(403).json({ message: 'Access Denied: Insufficient permissions.' });
    }

    let query = {};

    if (userRole === 'technician') {
      const username = auth.sessionClaims?.username;
      console.log('CLERK USERNAME:', username);

      const allTechs = await Technician.find().select('name');
      console.log('TECHNICIANS IN DB:', allTechs.map(t => t.name));

      const technician = await Technician.findOne({ name: username });
      if (!technician) {
        return res.status(404).json({ message: `Technician profile not found for username: ${username}` });
      }
      query = { assignedTechnicianId: technician._id };
    }

    const tickets = await Ticket.find(query)
      .populate('assignedTechnicianId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching all tickets.', error: error.message });
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

// UPDATE TICKET STATUS (Technician action)
// Add this to the existing ticketController.js exports
// ==========================================
const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Assigned', 'In Progress', 'Closed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.status === 'Resolved') return res.status(400).json({ message: 'Cannot update a resolved ticket.' });

    // Set respondedAt on first response
    if (status === 'In Progress' && !ticket.respondedAt) {
      ticket.respondedAt = new Date();

      // Check response SLA breach
      if (ticket.respondedAt > ticket.slaResponseDue) {
        ticket.slaResponseBreached = true;
      }
    }

    ticket.status = status;
    await ticket.save();

    res.status(200).json({ message: 'Ticket status updated.', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating status.', error: error.message });
  }
};

module.exports = {
  createTicket,
  resolveTicket,
  getTickets,
  getAllTickets,
  getTicketById,
  updateTicketStatus
};
