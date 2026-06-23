const express = require('express');
const router = express.Router();
const { syncUser, getCurrentUser } = require('../controllers/userController');

router.post('/sync', syncUser);
router.get('/me', getCurrentUser);

module.exports = router;