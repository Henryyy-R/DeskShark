const mongoose = require('mongoose');
const Technician = require('./models/Technician');
const Ticket = require('./models/Ticket');
require('dotenv').config();

// Import all our engines
const { calculatePriority } = require('./utils/priorityCalculator');
const { calculateSLADates } = require('./utils/slaCalculator');
const { assignTechnician } = require('./utils/assignmentEngine');
const { detectSLABreach } = require('./utils/slaBreachDetector');
const { checkEscalationThreshold } = require('./utils/escalationCalculator');
const { calculatePerformanceScore } = require('./utils/performanceCalculator');

const runFullSimulation = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("==========================================");
    console.log("🦈 DESKSHARK FULL SYSTEM SIMULATION 🦈");
    console.log("==========================================\n");

    // --- PHASE 1: SYSTEM STATE ---
    console.log("1️⃣  PHASE 1: Fetching Technicians...");
    const availableTechnicians = await Technician.find().lean();
    console.log(`- Found ${availableTechnicians.length} technicians in the database.\n`);

    // --- PHASE 2: TICKET INGESTION (7.1, 7.2, 7.4) ---
    console.log("2️⃣  PHASE 2: Ingesting New Ticket...");
    
    // Simulate Request Body
    const impact = 5;
    const urgency = 4;
    const affectedUsers = 10;
    const category = 'Network';

    // Algo 7.2: Priority
    const { level, score } = calculatePriority(impact, urgency, affectedUsers);
    console.log(`- Algo 7.2 Priority Calc: Score ${score} -> ${level}`);

    // Setup SLAs
    const { responseDue, resolutionDue } = calculateSLADates(level);

    // Algo 7.1 & 7.4: Assignment
    const assignmentResult = assignTechnician(category, availableTechnicians);
    
    // Find the winner's name just for the console log
    const winner = availableTechnicians.find(t => t._id.toString() === assignmentResult.technicianId?.toString());
    console.log(`- Algo 7.1 & 7.4 Assignment: Engine selected ${winner ? winner.name : 'None'} (${assignmentResult.flag})\n`);

    // Create the dummy ticket in memory
    let ticket = new Ticket({
      title: "System Simulation Ticket",
      category, impact, urgency, priority: level, priorityScore: score,
      assignedTechnicianId: assignmentResult.technicianId,
      slaResponseDue: responseDue, slaResolutionDue: resolutionDue,
      ticketNumber: "TKT-SIM-101",
      requesterId: new mongoose.Types.ObjectId()
    });

    // --- PHASE 3: TIME TRAVEL & BACKGROUND SWEEP (7.3, 7.7) ---
    console.log("3️⃣  PHASE 3: Simulating Background Monitor Sweep...");
    
    // We warp time by setting the created time 5 hours in the past
    // Critical Resolution SLA is 4 hours, so this is well past 100%
    const now = new Date();
    ticket.createdAt = new Date(now.getTime() - (5 * 60 * 60 * 1000)); 
    ticket.slaResolutionDue = new Date(ticket.createdAt.getTime() + (4 * 60 * 60 * 1000));

    const { isResponseBreached, isResolutionBreached } = detectSLABreach(ticket, now);
    const isNearBreach = checkEscalationThreshold(ticket, now);

    console.log(`- Algo 7.3 Breach Detector: Caught Response: ${isResponseBreached} | Resolution: ${isResolutionBreached}`);
    console.log(`- Algo 7.7 Escalation Calc: Threshold Crossed: ${isNearBreach}\n`);

    // --- PHASE 4: RESOLUTION & GRADING (7.5) ---
    console.log("4️⃣  PHASE 4: Ticket Resolution & Tech Grading...");
    
    // The tech finally closes it. We grade them.
    // Let's say they have 80 lifetime tickets resolved, a 4.7 star rating, and 95% SLA compliance
    const newPerformanceScore = calculatePerformanceScore(80, 4.7, 95);
    console.log(`- Algo 7.5 Performance Rating: Tech graded at ${newPerformanceScore}/100 based on lifetime metrics.\n`);

    console.log("==========================================");
    console.log("✅ SIMULATION COMPLETE: ALL SYSTEMS NOMINAL");
    console.log("==========================================");

    process.exit();
  } catch (error) {
    console.error("Simulation Failed:", error);
    process.exit(1);
  }
};

runFullSimulation();