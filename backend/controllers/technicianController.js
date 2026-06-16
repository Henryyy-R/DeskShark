const Technician = require('../models/Technician');

// ==========================================
// GET ALL TECHNICIANS (Staff Directory)
// ==========================================
const getTechnicians = async (req, res) => {
  try {
    // Fetch all technicians and sort them alphabetically by name
    const technicians = await Technician.find().sort({ name: 1 });
    res.status(200).json(technicians);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch technicians', error: error.message });
  }
};

// ==========================================
// GET TECHNICIAN BY ID (Detailed Profile)
// ==========================================
const getTechnicianById = async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id);
    
    if (!technician) {
      return res.status(404).json({ message: 'Technician not found' });
    }

    res.status(200).json(technician);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch technician profile', error: error.message });
  }
};

module.exports = {
  getTechnicians,
  getTechnicianById
};