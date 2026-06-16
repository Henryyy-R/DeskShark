const mongoose = require('mongoose');
const Ticket = require('./models/Ticket');
const { detectSLABreach } = require('./utils/slaBreachDetector');
require('dotenv').config();

const runTest = async () => {
  try {
    // 1. Connect to the Database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Database. Fetching your newest ticket...');

    // 2. Grab the most recently created ticket (The Critical one you just made)
    const ticket = await Ticket.findOne().sort({ createdAt: -1 });

    if (!ticket) {
      console.log('No tickets found in the database!');
      process.exit();
    }

    console.log(`\n--- Testing Ticket: ${ticket.ticketNumber} (${ticket.priority}) ---`);

    // Scenario 1: Checking right now (Should be false/false)
    const rightNow = new Date();
    console.log('\nScenario 1: Checking Right Now');
    console.log(detectSLABreach(ticket, rightNow));

    // Scenario 2: Time travel 20 minutes forward 
    // (Critical SLA Response is 15 mins. This should breach Response only!)
    const twentyMinsLater = new Date(ticket.createdAt.getTime() + 20 * 60 * 1000);
    console.log('\nScenario 2: Time travel 20 minutes forward');
    console.log(detectSLABreach(ticket, twentyMinsLater));

    // Scenario 3: Time travel 5 hours forward
    // (Critical SLA Resolution is 4 hours. This should breach BOTH!)
    const fiveHoursLater = new Date(ticket.createdAt.getTime() + 5 * 60 * 60 * 1000);
    console.log('\nScenario 3: Time travel 5 hours forward');
    console.log(detectSLABreach(ticket, fiveHoursLater));

    process.exit();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

runTest();