const express = require('express');
const router = express.Router();

// Import all functions from the controller
const { 
  createTicket, 
  resolveTicket, 
  getTickets, 
  getTicketById 
} = require('../controllers/ticketController');

// --- Standard CRUD Routes ---
router.post('/', createTicket);
router.get('/', getTickets);          // Get all tickets
router.get('/:id', getTicketById);    // Get one specific ticket

// --- Specialized Action Routes ---
router.put('/:id/resolve', resolveTicket);

module.exports = router;