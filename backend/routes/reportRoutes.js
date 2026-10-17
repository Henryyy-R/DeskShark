const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  exportTicketReport,
  exportTechnicianReport,
  exportSLAReport
} = require('../controllers/reportController');
const { getAuth } = require('@clerk/express');

// Admin only guard
const requireAdmin = (req, res, next) => {
  const auth = getAuth(req);
  const role = auth.sessionClaims?.metadata?.role;
  if (role !== 'admin') {
    return res.status(403).json({ message: 'Access Denied: Admins only.' });
  }
  next();
};

// Dashboard stats (used by admin dashboard KPIs and reports tab)
router.get('/dashboard', getDashboardStats);

// CSV exports — admin only
router.get('/export/tickets', requireAdmin, exportTicketReport);
router.get('/export/technicians', requireAdmin, exportTechnicianReport);
router.get('/export/sla', requireAdmin, exportSLAReport);

module.exports = router;
