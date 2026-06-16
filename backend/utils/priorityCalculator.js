const calculatePriority = (impact, urgency, affectedUsers) => {
  const safeImpact = impact || 0;
  const safeUrgency = urgency || 0;
  const safeUsers = affectedUsers || 0;

  const score = (safeImpact * 5) + (safeUrgency * 4) + (safeUsers * 3);

  let level = 'Low';
  if (score > 70) level = 'Critical';
  else if (score > 50) level = 'High';
  else if (score > 30) level = 'Medium';
  
  // Return an object containing both values
  return { level, score }; 
};

module.exports = { calculatePriority };