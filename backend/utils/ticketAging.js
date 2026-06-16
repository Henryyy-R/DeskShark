/**
 * Calculates Ticket Aging based on Section 7.6 of DeskShark documentation.
 * Used for administrative dashboard reporting and visual escalation triggers.
 */
const calculateTicketAging = (createdAt) => {
  if (!createdAt) return { ageInDays: 0, status: 'Normal' };

  // 1. Calculate absolute time difference
  const now = new Date();
  const createdDate = new Date(createdAt);
  const diffInMilliseconds = Math.abs(now - createdDate);

  // 2. Convert to days (rounding down to get full days elapsed)
  const ageInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

  // 3. Apply Section 7.6 Status Rules
  let status = 'Normal';
  
  if (ageInDays >= 8) {
    status = 'Escalation';
  } else if (ageInDays >= 4) {
    status = 'Warning';
  } // 0-3 days defaults to 'Normal'

  return { 
    ageInDays, 
    status 
  };
};

module.exports = { calculateTicketAging };