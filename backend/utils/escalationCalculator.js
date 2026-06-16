/**
 * DeskShark Algorithm 7.7: Automatic Escalation
 * Calculates if an unresolved ticket has crossed the 80% threshold of its SLA Resolution window.
 */
const checkEscalationThreshold = (ticket, actionDate = new Date()) => {
  // 1. If it is already resolved, it cannot be escalated
  if (ticket.resolvedAt) {
    return false;
  }

  const createdTime = new Date(ticket.createdAt).getTime();
  const dueTime = new Date(ticket.slaResolutionDue).getTime();
  const currentTime = actionDate.getTime();

  // 2. Calculate the total SLA duration in milliseconds
  const totalSlaDuration = dueTime - createdTime;

  // 3. Find the exact timestamp for the 80% threshold (Section 7.7)
  const thresholdTimestamp = createdTime + (totalSlaDuration * 0.8);

  // 4. Return true if we have crossed the threshold
  return currentTime >= thresholdTimestamp;
};

module.exports = { checkEscalationThreshold };