const axios = require('axios');

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API = 'https://api.clerk.com/v1';

const clerkHeaders = {
  Authorization: `Bearer ${CLERK_SECRET_KEY}`,
  'Content-Type': 'application/json'
};

const getAllUsers = async (req, res) => {
  try {
    const response = await axios.get(`${CLERK_API}/users?limit=100`, { headers: clerkHeaders });
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.response?.data || error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: 'username, email, password and role are required.' });
    }
    const createResponse = await axios.post(`${CLERK_API}/users`, {
      username,
      email_address: [email],
      password,
      public_metadata: { role }
    }, { headers: clerkHeaders });
    res.status(201).json(createResponse.data);
  } catch (error) {
    const msg = error.response?.data?.errors?.[0]?.long_message || error.message;
    res.status(500).json({ message: msg });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const validRoles = ['employee', 'technician', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }
    await axios.patch(`${CLERK_API}/users/${userId}/metadata`, {
      public_metadata: { role }
    }, { headers: clerkHeaders });
    res.status(200).json({ message: `Role updated to ${role}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update role', error: error.response?.data || error.message });
  }
};

const updateUserCredentials = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, password } = req.body;

    if (!email && !password) {
      return res.status(400).json({ message: 'Provide at least an email or password to update.' });
    }

    if (password) {
      await axios.patch(`${CLERK_API}/users/${userId}`, { password }, { headers: clerkHeaders });
    }

    if (email) {
      const userRes = await axios.get(`${CLERK_API}/users/${userId}`, { headers: clerkHeaders });
      const existingEmails = userRes.data.email_addresses || [];

      const addEmailRes = await axios.post(`${CLERK_API}/email_addresses`, {
        user_id: userId,
        email_address: email,
        verified: true,
        primary: true
      }, { headers: clerkHeaders });

      await axios.patch(`${CLERK_API}/users/${userId}`, {
        primary_email_address_id: addEmailRes.data.id
      }, { headers: clerkHeaders });

      for (const oldEmail of existingEmails) {
        if (oldEmail.id !== addEmailRes.data.id) {
          await axios.delete(`${CLERK_API}/email_addresses/${oldEmail.id}`, { headers: clerkHeaders });
        }
      }
    }

    res.status(200).json({ message: 'User credentials updated successfully.' });
  } catch (error) {
    const msg = error.response?.data?.errors?.[0]?.long_message || error.message;
    res.status(500).json({ message: msg });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await axios.delete(`${CLERK_API}/users/${userId}`, { headers: clerkHeaders });
    res.status(200).json({ message: 'User deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.response?.data || error.message });
  }
};

module.exports = { getAllUsers, createUser, updateUserRole, updateUserCredentials, deleteUser };