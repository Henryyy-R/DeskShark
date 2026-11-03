const SLARule = require('../models/SLARule');

/**
 * Calculates Response and Resolution SLA due dates based on priority level.
 * Uses absolute calendar hours for calculations.
 * These are the built-in defaults, used when no SLA rule has been configured.
 */
const calculateSLADates = (priorityLevel) => {
  const now = new Date();

  let responseHours = 24; // Defaults to Low
  let resolutionHours = 72; // Defaults to Low

  // The ITIL Baseline Matrix
  switch (priorityLevel) {
    case 'Critical':
      responseHours = 0.25; // 15 minutes
      resolutionHours = 4;
      break;
    case 'High':
      responseHours = 1;
      resolutionHours = 8;
      break;
    case 'Medium':
      responseHours = 4;
      resolutionHours = 24;
      break;
    case 'Low':
    default:
      responseHours = 24;
      resolutionHours = 72;
      break;
  }

  // Convert the hours into exact future timestamps
  const responseDue = new Date(now.getTime() + responseHours * 60 * 60 * 1000);
  const resolutionDue = new Date(now.getTime() + resolutionHours * 60 * 60 * 1000);

  return { responseDue, resolutionDue };
};

/**
 * Same result, but uses the active SLA rule for the priority when one exists
 * (the targets an admin edits on the SLA Rules tab). Falls back to the built-in
 * defaults when there is no active rule or its values are not usable.
 * Only affects tickets created afterwards: existing tickets keep their deadlines.
 */
const getSLADates = async (priorityLevel) => {
  const rule = await SLARule.findOne({ priorityLevel, isActive: true }).lean();
  const usable = rule && rule.responseTargetMinutes > 0 && rule.resolutionTargetMinutes > 0;
  if (!usable) return calculateSLADates(priorityLevel);

  const now = Date.now();
  return {
    responseDue: new Date(now + rule.responseTargetMinutes * 60 * 1000),
    resolutionDue: new Date(now + rule.resolutionTargetMinutes * 60 * 1000)
  };
};

module.exports = { calculateSLADates, getSLADates };