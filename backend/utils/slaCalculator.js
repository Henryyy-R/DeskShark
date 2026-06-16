/**
 * Calculates Response and Resolution SLA due dates based on priority level.
 * Uses absolute calendar hours for calculations.
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

module.exports = { calculateSLADates };