const Ticket = require('../models/Ticket');
const Technician = require('../models/Technician');

// ==========================================
// DASHBOARD STATS (FR-13 & FR-14)
// ==========================================
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
      Ticket.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Technician.find().sort({ performanceScore: -1 }).lean()
    ]);

    res.status(200).json({
      ticketStats: {
        totalTickets,
        openTickets,
        resolvedTickets,
        slaBreaches: { response: responseBreaches, resolution: resolutionBreaches },
        byPriority
      },
      technicianLeaderboard: technicians
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
};

// ==========================================
// EXPORT TICKET REPORT AS CSV (FR-13)
// ==========================================
const exportTicketReport = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('assignedTechnicianId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      'Ticket Number',
      'Title',
      'Description',
      'Category',
      'Priority',
      'Priority Score',
      'Status',
      'Impact',
      'Urgency',
      'Affected Users',
      'Assigned Technician',
      'SLA Response Due',
      'SLA Resolution Due',
      'Response Breached',
      'Resolution Breached',
      'Responded At',
      'Resolved At',
      'Resolution Note',
      'Created At'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
    };

    const rows = tickets.map(t => [
      escapeCsv(t.ticketNumber),
      escapeCsv(t.title),
      escapeCsv(t.description),
      escapeCsv(t.category),
      escapeCsv(t.priority),
      escapeCsv(t.priorityScore),
      escapeCsv(t.status),
      escapeCsv(t.impact),
      escapeCsv(t.urgency),
      escapeCsv(t.affectedUsers),
      escapeCsv(t.assignedTechnicianId?.name || 'Unassigned'),
      escapeCsv(t.slaResponseDue ? new Date(t.slaResponseDue).toLocaleString() : ''),
      escapeCsv(t.slaResolutionDue ? new Date(t.slaResolutionDue).toLocaleString() : ''),
      escapeCsv(t.slaResponseBreached ? 'Yes' : 'No'),
      escapeCsv(t.slaResolutionBreached ? 'Yes' : 'No'),
      escapeCsv(t.respondedAt ? new Date(t.respondedAt).toLocaleString() : ''),
      escapeCsv(t.resolvedAt ? new Date(t.resolvedAt).toLocaleString() : ''),
      escapeCsv(t.resolutionNote || ''),
      escapeCsv(new Date(t.createdAt).toLocaleString())
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const filename = `DeskShark_Tickets_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export ticket report', error: error.message });
  }
};

// ==========================================
// EXPORT TECHNICIAN PERFORMANCE REPORT AS CSV (FR-14)
// ==========================================
const exportTechnicianReport = async (req, res) => {
  try {
    const technicians = await Technician.find().sort({ performanceScore: -1 }).lean();

    const headers = [
      'Name',
      'Email',
      'Skills',
      'Active Tickets',
      'Maximum Capacity',
      'Workload Ratio',
      'Performance Score',
      'PerfRating (1-5)',
      'Average Customer Rating'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
    };

    const rows = technicians.map(t => {
      const workloadRatio = t.maximumCapacity > 0
        ? (t.activeTickets / t.maximumCapacity).toFixed(2)
        : '0.00';
      // Section 7.5.1: PerfRating derived on demand
      const perfRating = (t.performanceScore / 20).toFixed(2);

      return [
        escapeCsv(t.name),
        escapeCsv(t.email),
        escapeCsv(t.skills?.join('; ') || ''),
        escapeCsv(t.activeTickets),
        escapeCsv(t.maximumCapacity),
        escapeCsv(workloadRatio),
        escapeCsv(t.performanceScore),
        escapeCsv(perfRating),
        escapeCsv(t.averageCustomerRating || 4.0)
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const filename = `DeskShark_Technicians_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export technician report', error: error.message });
  }
};

// ==========================================
// EXPORT SLA COMPLIANCE REPORT AS CSV
// ==========================================
const exportSLAReport = async (req, res) => {
  try {
    const tickets = await Ticket.find({ status: { $in: ['Resolved', 'Closed'] } })
      .populate('assignedTechnicianId', 'name')
      .lean();

    const headers = [
      'Ticket Number',
      'Title',
      'Priority',
      'Assigned Technician',
      'Created At',
      'Resolved At',
      'Resolution Time (mins)',
      'SLA Resolution Target (mins)',
      'Response Breached',
      'Resolution Breached'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
    };

    // SLA resolution targets per priority (minutes)
    const slaTargets = { Critical: 240, High: 480, Medium: 1440, Low: 4320 };

    const rows = tickets.map(t => {
      const resolutionMins = t.resolvedAt
        ? Math.round((new Date(t.resolvedAt) - new Date(t.createdAt)) / 60000)
        : '';
      const slaTarget = slaTargets[t.priority] || '';

      return [
        escapeCsv(t.ticketNumber),
        escapeCsv(t.title),
        escapeCsv(t.priority),
        escapeCsv(t.assignedTechnicianId?.name || 'Unassigned'),
        escapeCsv(new Date(t.createdAt).toLocaleString()),
        escapeCsv(t.resolvedAt ? new Date(t.resolvedAt).toLocaleString() : ''),
        escapeCsv(resolutionMins),
        escapeCsv(slaTarget),
        escapeCsv(t.slaResponseBreached ? 'Yes' : 'No'),
        escapeCsv(t.slaResolutionBreached ? 'Yes' : 'No')
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const filename = `DeskShark_SLA_Report_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export SLA report', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  exportTicketReport,
  exportTechnicianReport,
  exportSLAReport
};
