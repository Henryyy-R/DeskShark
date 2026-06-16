const Ticket = require('../models/Ticket');
const Technician = require('../models/Technician');

// ==========================================
// GENERATE DASHBOARD REPORTS (FR-13 & FR-14)
// ==========================================
const getDashboardStats = async (req, res) => {
  try {
    // 1. Ticket Statistics (FR-13)
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: 'Open' });
    const resolvedTickets = await Ticket.countDocuments({ status: 'Resolved' });
    
    // SLA Breaches (FR-12 Tracking)
    const breachedResponses = await Ticket.countDocuments({ slaResponseBreached: true });
    const breachedResolutions = await Ticket.countDocuments({ slaResolutionBreached: true });

    // Tickets grouped by Priority
    const priorityStats = await Ticket.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    // 2. Technician Performance Reports (FR-14)
    // Fetch all technicians and sort them by their Section 7.5 PerformanceScore (highest first)
    const topTechnicians = await Technician.find()
      .select('name email activeTickets performanceScore') // Only grab what we need
      .sort({ performanceScore: -1 });

    // 3. Send the aggregated payload
    res.status(200).json({
      ticketStats: {
        totalTickets,
        openTickets,
        resolvedTickets,
        slaBreaches: {
          response: breachedResponses,
          resolution: breachedResolutions
        },
        byPriority: priorityStats
      },
      technicianLeaderboard: topTechnicians
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to generate reports', error: error.message });
  }
};

module.exports = {
  getDashboardStats
};