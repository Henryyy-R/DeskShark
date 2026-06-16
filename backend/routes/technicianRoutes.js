const express = require('express');
const router = express.Router();

const { 
  getTechnicians, 
  getTechnicianById 
} = require('../controllers/technicianController');

// --- Technician Management Routes ---

// GET /api/technicians - Returns the whole team
router.get('/', getTechnicians);

// GET /api/technicians/:id - Returns a specific technician
router.get('/:id', getTechnicianById);

module.exports = router;