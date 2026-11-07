const { getAuth } = require('@clerk/express');
const Technician = require('../models/Technician');

/**
 * Ticket access rules.
 *  - admin:      every ticket
 *  - technician: only tickets assigned to their technician profile
 *  - employee:   only tickets they created (any other or missing role counts as employee)
 */

// Who is making this request. For a technician, also finds their technician profile,
// which is matched to the Clerk username by name.
const getRequester = async (req) => {
  const auth = getAuth(req);
  const claimedRole = auth.sessionClaims?.metadata?.role;
  const role = ['admin', 'technician'].includes(claimedRole) ? claimedRole : 'employee';
  const username = auth.sessionClaims?.username;

  let technicianId = null;
  if (role === 'technician' && username) {
    const technician = await Technician.findOne({ name: username }).select('_id').lean();
    technicianId = technician ? technician._id : null;
  }

  return { userId: auth.userId, role, username, technicianId };
};

// May this requester see the ticket (and its public comments)?
const canAccessTicket = (who, ticket) => {
  if (who.role === 'admin') return true;
  if (who.role === 'technician') {
    const assigned = ticket.assignedTechnicianId?._id || ticket.assignedTechnicianId;
    return Boolean(who.technicianId && assigned && String(assigned) === String(who.technicianId));
  }
  return ticket.requesterId === who.userId;
};

// May this requester change the ticket (status, resolve, internal notes)?
const canWorkOnTicket = (who, ticket) => who.role !== 'employee' && canAccessTicket(who, ticket);

module.exports = { getRequester, canAccessTicket, canWorkOnTicket };