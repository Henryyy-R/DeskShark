const cron = require('node-cron');
const Ticket = require('../models/Ticket');

// Import the exact utilities you used in your test script!
const { detectSLABreach } = require('../utils/slaBreachDetector');
const { checkEscalationThreshold } = require('../utils/escalationCalculator');

const startSLAMonitor = () => {
  // Runs every 5 minutes automatically
  cron.schedule('*/5 * * * *', async () => {
    console.log('⏰ [Cron] Running background SLA sweep...');

    try {
      const now = new Date();
      // Grab all tickets that are still open
      const openTickets = await Ticket.find({ status: { $ne: 'Resolved' } });
      let updatesCount = 0;

      for (let ticket of openTickets) {
        let isModified = false;

        // 1. Use YOUR utility to check for breaches
        const { isResponseBreached, isResolutionBreached } = detectSLABreach(ticket, now);

        if (isResponseBreached && !ticket.slaResponseBreached) {
            ticket.slaResponseBreached = true;
            isModified = true;
            console.log(`🚨 RESPONSE BREACH: ${ticket.ticketNumber}`);
        }

        if (isResolutionBreached && !ticket.slaResolutionBreached) {
            ticket.slaResolutionBreached = true;
            isModified = true;
            console.log(`🚨 RESOLUTION BREACH: ${ticket.ticketNumber}`);
        }

        // 2. Use YOUR utility to check for escalation
        const isNearBreach = checkEscalationThreshold(ticket, now);
        
        if (isNearBreach && ticket.status !== 'Escalated' && !isResolutionBreached) {
            ticket.status = 'Escalated';
            isModified = true;
            console.log(`⚠️ ESCALATED: ${ticket.ticketNumber}`);
        }

        // Save if your utilities caught anything
        if (isModified) {
          await ticket.save();
          updatesCount++;
        }
      }

      if (updatesCount > 0) console.log(`✅ [Cron] Sweep updated ${updatesCount} tickets.`);

    } catch (error) {
      console.error('❌ [Cron] Error:', error.message);
    }
  });
};

module.exports = startSLAMonitor;