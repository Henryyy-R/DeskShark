const mongoose = require('mongoose');
const Technician = require('./models/Technician');
require('dotenv').config(); 

const seedDatabase = async () => {
  try {
    // Connect to your database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Database. Clearing old techs...');
    await Technician.deleteMany({}); // Clears any old tests

    // The Exact Example from Section 7.1 Documentation
    const techs = [
      {
        name: 'John',
        email: 'john@deskshark.com',
        skills: ['Network', 'Hardware'], // SkillMatch = 1 for Network
        activeTickets: 2,
        maximumCapacity: 10,
        performanceScore: 96 // 96 / 20 = 4.8 PerfRating
      },
      {
        name: 'Henry',
        email: 'henry@deskshark.com',
        skills: ['Network', 'Software'], // SkillMatch = 1 for Network
        activeTickets: 5,
        maximumCapacity: 10,
        performanceScore: 90 // 90 / 20 = 4.5 PerfRating
      }
    ];

    await Technician.insertMany(techs);
    console.log('Successfully injected John and Henry!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDatabase();