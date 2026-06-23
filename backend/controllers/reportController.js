const Ticket = require('../models/Ticket');
const Technician = require('../models/Technician');

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalTickets,
      openTickets,
      resolvedTickets,
      responseBreaches,
      resolutionBreaches,
      byPriority,
      technicians
    ] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: { $in: ['Open', 'Assigned', 'In Progress'] } }),
      Ticket.countDocuments({ status: { $in: ['Resolved', 'Closed'] } }),
      Ticket.countDocuments({ slaResponseBreached: true }),
      Ticket.countDocuments({ slaResolutionBreached: true }),
      Ticket.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Technician.find().sort({ performanceScore: -1 }).lean()
    ]);

    res.status(200).json({
      ticketStats: {
        totalTickets,
        openTickets,
        resolvedTickets,
        slaBreaches: {
          response: responseBreaches,
          resolution: resolutionBreaches
        },
        byPriority
      },
      technicianLeaderboard: technicians
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
};

module.exports = { getDashboardStats };
