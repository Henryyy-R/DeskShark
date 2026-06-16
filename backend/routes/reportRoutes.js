const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/reportController');

// GET /api/reports/dashboard
router.get('/dashboard', getDashboardStats);

module.exports = router;