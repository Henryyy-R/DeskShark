const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, updateUserRole, deleteUser } = require('../controllers/adminController');
const { getAuth } = require('@clerk/express');

// Admin-only guard
const requireAdmin = (req, res, next) => {
  const auth = getAuth(req);
  const role = auth.sessionClaims?.metadata?.role;
  if (role !== 'admin') {
    return res.status(403).json({ message: 'Access Denied: Admins only.' });
  }
  next();
};

router.get('/users', requireAdmin, getAllUsers);
router.post('/users', requireAdmin, createUser);
router.put('/users/:userId/role', requireAdmin, updateUserRole);
router.delete('/users/:userId', requireAdmin, deleteUser);

module.exports = router;
