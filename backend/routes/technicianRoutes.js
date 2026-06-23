const express = require('express');
const router = express.Router();
const { getTechnicians, getTechnicianById, createTechnician, updateTechnician, deleteTechnician } = require('../controllers/technicianController');
const { getAuth } = require('@clerk/express');

// Admin-only guard for write operations
const requireAdmin = (req, res, next) => {
  const auth = getAuth(req);
  const role = auth.sessionClaims?.metadata?.role;
  if (role !== 'admin') {
    return res.status(403).json({ message: 'Access Denied: Admins only.' });
  }
  next();
};

router.get('/', getTechnicians);
router.get('/:id', getTechnicianById);
router.post('/', requireAdmin, createTechnician);
router.put('/:id', requireAdmin, updateTechnician);
router.delete('/:id', requireAdmin, deleteTechnician);

module.exports = router;
