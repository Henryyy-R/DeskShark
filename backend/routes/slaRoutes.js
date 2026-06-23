const express = require('express');
const router = express.Router();
const { getSLARules, updateSLARule, initSLARules } = require('../controllers/slaController');
const { getAuth } = require('@clerk/express');

const requireAdmin = (req, res, next) => {
  const auth = getAuth(req);
  const role = auth.sessionClaims?.metadata?.role;
  if (role !== 'admin') {
    return res.status(403).json({ message: 'Access Denied: Admins only.' });
  }
  next();
};

router.get('/', getSLARules);
router.put('/:id', requireAdmin, updateSLARule);
router.post('/init', requireAdmin, initSLARules);

module.exports = router;
