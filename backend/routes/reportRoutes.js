const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/reportController');

router.get('/dashboard', getDashboardStats);

module.exports = router;
