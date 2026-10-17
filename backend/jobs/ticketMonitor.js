const cron = require('node-cron');
const Ticket = require('../models/Ticket');
const Technician = require('../models/Technician');
const { detectSLABreach } = require('../utils/slaBreachDetector');
const { checkEscalationThreshold } = require('../utils/escalationCalculator');
const { createNotification } = require('../utils/notificationHelper');

const startTicketMonitor = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('🔍 [Cron] Running background ticket sweep...');

    try {
      const openTickets = await Ticket.find({ resolvedAt: null }).populate('assignedTechnicianId');

      if (openTickets.length === 0) {
        console.log('✅ [Cron] No open tickets to process.');
        return;
      }

      const now = new Date();
      let updatedCount = 0;

      for (const ticket of openTickets) {
        let needsUpdate = false;

        // --- Algorithm 7.3: SLA Breach Detection ---
        const { isResponseBreached, isResolutionBreached } = detectSLABreach(ticket, now);

        if (isResponseBreached && !ticket.slaResponseBreached) {
          ticket.slaResponseBreached = true;
          needsUpdate = true;

          // Notify requester of response SLA breach
          await createNotification({
            recipientId: ticket.requesterId,
            ticketId: ticket._id,
            type: 'SLA_Breach',
            message: `Response SLA breached for ticket "${ticket.title}". Our team is working to resolve this.`
          });
        }

        if (isResolutionBreached && !ticket.slaResolutionBreached) {
          ticket.slaResolutionBreached = true;
          needsUpdate = true;

          // Notify requester
          await createNotification({
            recipientId: ticket.requesterId,
            ticketId: ticket._id,
            type: 'SLA_Breach',
            message: `Resolution SLA breached for ticket "${ticket.title}".`
          });

          // Notify assigned technician if exists
          if (ticket.assignedTechnicianId) {
            console.log(`[Notification] SLA breach - notifying technician: ${ticket.assignedTechnicianId.name}`);
          }
        }

        // --- Algorithm 7.7: Automatic Escalation (Near Breach Warning) ---
        if (!ticket.slaResolutionBreached) {
          const isNearBreach = checkEscalationThreshold(ticket, now);

          if (isNearBreach && ticket.status !== 'Escalated') {
            ticket.status = 'Escalated';
            needsUpdate = true;

            // Notify requester of near breach
            await createNotification({
              recipientId: ticket.requesterId,
              ticketId: ticket._id,
              type: 'SLA_Warning',
              message: `Your ticket "${ticket.title}" is approaching its SLA deadline. A technician has been alerted.`
            });

            // Log technician alert (full tech notification needs clerkId on technician model)
            if (ticket.assignedTechnicianId) {
              console.log(`[Notification] Near breach escalation - technician: ${ticket.assignedTechnicianId.name}, ticket: ${ticket.ticketNumber}`);
            }
          }
        }

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
