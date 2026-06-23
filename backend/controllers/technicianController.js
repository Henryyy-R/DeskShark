const Technician = require('../models/Technician');

// GET all technicians
const getTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find().sort({ performanceScore: -1 });
    res.status(200).json(technicians);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch technicians', error: error.message });
  }
};

// GET single technician
const getTechnicianById = async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id);
    if (!technician) return res.status(404).json({ message: 'Technician not found' });
    res.status(200).json(technician);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch technician', error: error.message });
  }
};

// POST create technician
const createTechnician = async (req, res) => {
  try {
    const { name, email, skills, maximumCapacity } = req.body;

    if (!name || !email || !skills || skills.length === 0) {
      return res.status(400).json({ message: 'name, email, and skills are required.' });
    }

    const existing = await Technician.findOne({ email });
    if (existing) return res.status(409).json({ message: 'A technician with this email already exists.' });

    const technician = new Technician({
      name,
      email,
      skills,
      maximumCapacity: maximumCapacity || 10,
      activeTickets: 0,
      performanceScore: 100
    });

    await technician.save();
    res.status(201).json(technician);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create technician', error: error.message });
  }
};

// PUT update technician
const updateTechnician = async (req, res) => {
  try {
    const { name, email, skills, maximumCapacity } = req.body;

    const technician = await Technician.findByIdAndUpdate(
      req.params.id,
      { name, email, skills, maximumCapacity },
      { new: true }
    );

    if (!technician) return res.status(404).json({ message: 'Technician not found' });
    res.status(200).json(technician);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update technician', error: error.message });
  }
};

// DELETE technician
const deleteTechnician = async (req, res) => {
  try {
    const technician = await Technician.findByIdAndDelete(req.params.id);
    if (!technician) return res.status(404).json({ message: 'Technician not found' });
    res.status(200).json({ message: 'Technician deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete technician', error: error.message });
  }
};

module.exports = { getTechnicians, getTechnicianById, createTechnician, updateTechnician, deleteTechnician };
