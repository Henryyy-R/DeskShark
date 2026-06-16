/**
 * DeskShark Algorithm 7.5: Technician Performance Rating
 * Calculates the master PerformanceScore (0-100 scale) based on resolved history.
 */
const calculatePerformanceScore = (resolvedNormalized, customerRatingRaw, slaCompliancePercent) => {
  // Catch missing values and default to baseline averages
  const safeResolved = resolvedNormalized || 0;
  const safeRatingRaw = customerRatingRaw || 3; // Default 3-star
  const safeSla = slaCompliancePercent || 0;

  // 1. Normalize Customer Rating from 1-5 scale to 0-100 scale
  // Example: 4.7 / 5 = 0.94 * 100 = 94
  const normalizedCustomerRating = (safeRatingRaw / 5) * 100;

  // 2. Apply Section 7.5 Weighted Formula
  const resolvedWeighted = safeResolved * 0.4;
  const ratingWeighted = normalizedCustomerRating * 0.3;
  const slaWeighted = safeSla * 0.3;

  // 3. Calculate total and round to the nearest whole number
  const rawScore = resolvedWeighted + ratingWeighted + slaWeighted;
  const performanceScore = Math.round(rawScore);

  // Note: Section 7.5.1 explicitly states PerfRating (1-5) is calculated 
  // ON-DEMAND inside the assignment engine via (PerformanceScore / 20).
  // Therefore, we strictly return the 0-100 master score here to be saved to the database.

  return performanceScore;
};

module.exports = { calculatePerformanceScore };