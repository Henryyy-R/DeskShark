/**
 * DeskShark Two-Stage Technician Assignment Pipeline
 * Integrates Section 7.1 (Assignment), 7.4 (Workload), and 7.5.1 (Performance)
 */
const assignTechnician = (ticketCategory, availableTechnicians) => {
  // If no technicians are online/exist in the database
  if (!availableTechnicians || availableTechnicians.length === 0) {
    return { technicianId: null, flag: 'Manual Admin Assignment' };
  }

  // ==========================================
  // STAGE 1: FILTER (Capacity & Skill Guardrails)
  // ==========================================
  const eligibleCandidates = availableTechnicians.filter(tech => {
    // 1. SkillMatch Filter
    const skillMatch = tech.skills.includes(ticketCategory) ? 1 : 0;
    if (skillMatch === 0) return false;

    // 2. WorkloadRatio Filter (Section 7.4)
    const workloadRatio = tech.activeTickets / tech.maximumCapacity;
    if (workloadRatio >= 0.9) return false; // Exclude overloaded techs

    return true;
  });

  // Fallback: If everyone is overloaded or lacks the skill
  if (eligibleCandidates.length === 0) {
    return { technicianId: null, flag: 'Manual Admin Assignment' };
  }

  // ==========================================
  // STAGE 2: SCORE & SELECT (Fine-grained ranking)
  // ==========================================
  const scoredCandidates = eligibleCandidates.map(tech => {
    // Calculate PerfRating from PerformanceScore (Section 7.5.1)
    const perfRating = tech.performanceScore / 20;
    
    // Calculate WorkloadRatio again for the tie-breaker
    const workloadRatio = tech.activeTickets / tech.maximumCapacity;

    // The Master Assignment Formula (Section 7.1)
    // SkillMatch is guaranteed to be 1 here because of Stage 1
    const assignmentScore = (1 * 50) - (tech.activeTickets * 5) + (perfRating * 10);

    return {
      ...tech,
      assignmentScore,
      workloadRatio
    };
  });

  // Sort the candidates to find the winner
  scoredCandidates.sort((a, b) => {
    // Primary condition: Highest Assignment Score wins
    if (b.assignmentScore !== a.assignmentScore) {
      return b.assignmentScore - a.assignmentScore;
    }
    // Tie-breaker: Lowest WorkloadRatio wins
    return a.workloadRatio - b.workloadRatio;
  });

  // Return the top-ranked technician
  const winner = scoredCandidates[0];
  
  return { 
    technicianId: winner._id, 
    flag: 'Auto-Assigned',
    scoreCalculated: winner.assignmentScore 
  };
};

module.exports = { assignTechnician };