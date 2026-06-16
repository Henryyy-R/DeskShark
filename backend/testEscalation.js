const { checkEscalationThreshold } = require('./utils/escalationCalculator');

console.log("--- Testing Algorithm 7.7: Automatic Escalation ---");

// Let's create a mock ticket with exactly a 10-hour SLA window
// This makes the math easy: The 80% threshold will be exactly 8 hours.
const now = new Date();
const createdTime = now.getTime();
const dueTime = createdTime + (10 * 60 * 60 * 1000); // 10 hours from creation

const mockTicket = {
  createdAt: new Date(createdTime),
  slaResolutionDue: new Date(dueTime),
  resolvedAt: null // Ticket is currently open
};

console.log("Ticket SLA Window: 10 Hours.");
console.log("Expected Escalation Threshold (80%): 8 Hours.\n");

// Scenario 1: Checking right after creation (0 hours)
console.log("Scenario 1: Checking at 0 Hours");
console.log("Expected: false");
console.log(`Result: ${checkEscalationThreshold(mockTicket, new Date(createdTime))}\n`);

// Scenario 2: Checking at 5 Hours (50% mark)
const fiveHoursLater = new Date(createdTime + (5 * 60 * 60 * 1000));
console.log("Scenario 2: Checking at 5 Hours (Safe)");
console.log("Expected: false");
console.log(`Result: ${checkEscalationThreshold(mockTicket, fiveHoursLater)}\n`);

// Scenario 3: Checking at 8.5 Hours (85% mark)
const eightHalfHoursLater = new Date(createdTime + (8.5 * 60 * 60 * 1000));
console.log("Scenario 3: Checking at 8.5 Hours (Crossed Threshold!)");
console.log("Expected: true");
console.log(`Result: ${checkEscalationThreshold(mockTicket, eightHalfHoursLater)}\n`);

// Scenario 4: Ticket crossed the time limit, but was ALREADY resolved
const resolvedTicket = { ...mockTicket, resolvedAt: new Date(createdTime + (2 * 60 * 60 * 1000)) };
console.log("Scenario 4: Checking at 8.5 Hours, but ticket is already closed");
console.log("Expected: false");
console.log(`Result: ${checkEscalationThreshold(resolvedTicket, eightHalfHoursLater)}\n`);