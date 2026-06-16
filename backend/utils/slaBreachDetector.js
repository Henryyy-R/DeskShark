/**
 * DeskShark Algorithm 7.3: SLA Breach Detection
 * Determines whether a ticket has violated SLA response or resolution deadlines.
 * Time Complexity: O(1)
 */
const detectSLABreach = (ticket, actionDate = new Date()) => {
  // Pull current status so we don't accidentally un-breach a ticket
  let isResponseBreached = ticket.slaResponseBreached;
  let isResolutionBreached = ticket.slaResolutionBreached;

  // 1. Check Response SLA 
  // If the ticket hasn't been responded to, OR the response happened after the deadline
  if (!ticket.respondedAt && actionDate > ticket.slaResponseDue) {
    isResponseBreached = true;
  } else if (ticket.respondedAt && ticket.respondedAt > ticket.slaResponseDue) {
    isResponseBreached = true;
  }

  // 2. Check Resolution SLA
  // If the ticket hasn't been resolved, OR the resolution happened after the deadline
  if (!ticket.resolvedAt && actionDate > ticket.slaResolutionDue) {
    isResolutionBreached = true;
  } else if (ticket.resolvedAt && ticket.resolvedAt > ticket.slaResolutionDue) {
    isResolutionBreached = true;
  }

  return { isResponseBreached, isResolutionBreached };
};

module.exports = { detectSLABreach };