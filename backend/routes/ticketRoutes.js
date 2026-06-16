const express = require('express');
const router = express.Router();
// Import the controller logic you just wrote
const { createTicket } = require('../controllers/ticketController');

// When a POST request hits this file, send it to the createTicket function
router.post('/', createTicket);

module.exports = router;