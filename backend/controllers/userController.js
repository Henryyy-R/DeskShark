const { getAuth } = require('@clerk/express');
const User = require('../models/User');

const syncUser = async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      return res.status(401).json({ message: 'Unauthorized request' });
    }

    const { name, email } = req.body;
    const role = auth.sessionClaims?.metadata?.role || 'employee';

    const user = await User.findOneAndUpdate(
      { clerkId: auth.userId },
      { clerkId: auth.userId, name, email, role },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to sync user', error: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      return res.status(401).json({ message: 'Unauthorized request' });
    }

    const user = await User.findOne({ clerkId: auth.userId });
    if (!user) return res.status(404).json({ message: 'User not found. Please sync first.' });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
};

module.exports = { syncUser, getCurrentUser };