const cron = require('node-cron');
const Ticket = require('../models/Ticket');
const { detectSLABreach } = require('../utils/slaBreachDetector');
const { checkEscalationThreshold } = require('../utils/escalationCalculator');

// This expression runs the job exactly every 5 minutes
const startTicketMonitor = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('🔍 [Cron] Running background ticket sweep...');

    try {
      // 1. Fetch all tickets that are NOT resolved
      const openTickets = await Ticket.find({ resolvedAt: null });

      if (openTickets.length === 0) {
        console.log('✅ [Cron] No open tickets to process.');
        return;
      }

      const now = new Date();
      let updatedCount = 0;

      // 2. Loop through every open ticket
      for (const ticket of openTickets) {
        let needsUpdate = false;

        // --- Algorithm 7.3: Check for SLA Breaches ---
        const { isResponseBreached, isResolutionBreached } = detectSLABreach(ticket, now);
        
        if (isResponseBreached && !ticket.slaResponseBreached) {
          ticket.slaResponseBreached = true;
          needsUpdate = true;
        }
        
        if (isResolutionBreached && !ticket.slaResolutionBreached) {
          ticket.slaResolutionBreached = true;
          needsUpdate = true;
        }

        // --- Algorithm 7.7: Check for Automatic Escalation ---
        // Only flag if it hasn't already breached its resolution SLA
        if (!ticket.slaResolutionBreached) {
          const isNearBreach = checkEscalationThreshold(ticket, now);
          
          if (isNearBreach && ticket.status !== 'Escalated') {
             ticket.status = 'Escalated';
             needsUpdate = true;
          }
        }

        // 3. Save only if something actually changed to protect database performance
        if (needsUpdate) {
          await ticket.save();
          updatedCount++;
        }
      }

      console.log(`⏱️ [Cron] Sweep complete. Updated statuses for ${updatedCount} tickets.`);

    } catch (error) {
      console.error('❌ [Cron] Error during ticket sweep:', error);
    }
  });
};

module.exports = { startTicketMonitor };