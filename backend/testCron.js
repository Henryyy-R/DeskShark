const mongoose = require('mongoose');
const Ticket = require('./models/Ticket');
const { detectSLABreach } = require('./utils/slaBreachDetector');
const { checkEscalationThreshold } = require('./utils/escalationCalculator');
require('dotenv').config();

const runTimeTravelTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🚀 Initializing Time Machine...");

    // 1. Grab the newest open ticket
    const ticket = await Ticket.findOne({ resolvedAt: null }).sort({ createdAt: -1 });

    if (!ticket) {
      console.log("❌ No open tickets found. Please create one in Thunder Client first!");
      process.exit();
    }

    console.log(`🎯 Targeting Ticket: ${ticket.ticketNumber}`);

    // ==========================================
    // 2. THE TIME WARP (Manipulate the DB)
    // ==========================================
    // We force the SLA Resolution Due date to be 1 minute in the past
    const expiredDate = new Date(Date.now() - (60 * 1000));
    ticket.slaResolutionDue = expiredDate;
    await ticket.save();
    
    console.log("⏩ Fast-forwarded time: SLA Resolution is now technically expired.\n");

    // ==========================================
    // 3. RUN THE SWEEP (Testing the logic)
    // ==========================================
    console.log("🔍 Running simulated background sweep...");
    
    const now = new Date();
    const { isResponseBreached, isResolutionBreached } = detectSLABreach(ticket, now);
    const isNearBreach = checkEscalationThreshold(ticket, now);

    console.log(`- Response Breached:   ${isResponseBreached}`);
    console.log(`- Resolution Breached: ${isResolutionBreached}`);
    console.log(`- Escalation Trigger:  ${isNearBreach}\n`);
    
    if (isResolutionBreached || isNearBreach) {
        console.log("✅ SUCCESS: The monitor perfectly caught the expired SLA!");
    } else {
        console.log("❌ FAIL: The monitor missed the expiration.");
    }

    process.exit();
  } catch (error) {
    console.error("Test Error:", error);
    process.exit(1);
  }
};

runTimeTravelTest();