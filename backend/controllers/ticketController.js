const { getAuth } = require('@clerk/express');
const Ticket = require('../models/Ticket');
const Technician = require('../models/Technician');
const { calculatePriority } = require('../utils/priorityCalculator');
const { calculateSLADates } = require('../utils/slaCalculator');
const { assignTechnician } = require('../utils/assignmentEngine');
const { calculatePerformanceScore } = require('../utils/performanceCalculator');
const { createNotification } = require('../utils/notificationHelper');

// ==========================================
// CREATE TICKET
// ==========================================
const createTicket = async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) return res.status(401).json({ message: 'Unauthorized request' });

    const { title, description, category, impact, urgency, affectedUsers } = req.body;

    const { level, score } = calculatePriority(impact, urgency, affectedUsers);
    const { responseDue, resolutionDue } = calculateSLADates(level);

    const availableTechnicians = await Technician.find().lean();
    const assignmentResult = assignTechnician(category, availableTechnicians);

    const generateTicketNumber = `TKT-${Date.now()}`;

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
      status: assignmentResult.technicianId ? 'Assigned' : 'Open'
    });

    const savedTicket = await newTicket.save();

    if (assignmentResult.technicianId) {
      await Technician.findByIdAndUpdate(
        assignmentResult.technicianId,
        { $inc: { activeTickets: 1 } }
      );
    }

    // Notify employee their ticket was submitted
    await createNotification({
      recipientId: auth.userId,
      ticketId: savedTicket._id,
      type: 'Assignment',
      message: `Your ticket "${savedTicket.title}" (${savedTicket.ticketNumber}) has been submitted and ${assignmentResult.technicianId ? 'assigned to a technician.' : 'is pending assignment.'}`
    });

    res.status(201).json(savedTicket);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create ticket', error: error.message });
  }
};

// ==========================================
// RESOLVE TICKET
// ==========================================
const resolveTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { resolutionNote } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.status === 'Resolved') return res.status(400).json({ message: 'Ticket is already resolved.' });

    ticket.status = 'Resolved';
    ticket.resolvedAt = new Date();
    if (resolutionNote) ticket.resolutionNote = resolutionNote;
    await ticket.save();

    // Notify employee ticket is resolved
    await createNotification({
      recipientId: ticket.requesterId,
      ticketId: ticket._id,
      type: 'Resolution',
      message: `Your ticket "${ticket.title}" (${ticket.ticketNumber}) has been resolved.${resolutionNote ? ' Note: ' + resolutionNote : ''}`
    });

    if (ticket.assignedTechnicianId) {
      const technician = await Technician.findById(ticket.assignedTechnicianId);
      if (technician) {
        technician.activeTickets = Math.max(0, technician.activeTickets - 1);

        const resolvedCount = await Ticket.countDocuments({
          assignedTechnicianId: technician._id,
          status: 'Resolved'
        });

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

        const resolvedNormalized = Math.min(resolvedCount, 100);
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
// GET TICKETS (Employee - own only)
// ==========================================
const getTickets = async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) return res.status(401).json({ message: 'Unauthorized request' });

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
// GET SINGLE TICKET BY ID
// ==========================================
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('assignedTechnicianId', 'name email');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching ticket.', error: error.message });
  }
};

// ==========================================
// UPDATE TICKET STATUS
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

    if (status === 'In Progress' && !ticket.respondedAt) {
      ticket.respondedAt = new Date();
      if (ticket.respondedAt > ticket.slaResponseDue) {
        ticket.slaResponseBreached = true;
      }
    }

    ticket.status = status;
    await ticket.save();

    // Notify employee of status change
    await createNotification({
      recipientId: ticket.requesterId,
      ticketId: ticket._id,
      type: 'StatusUpdate',
      message: `Your ticket "${ticket.title}" (${ticket.ticketNumber}) status has been updated to: ${status}.`
    });

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
