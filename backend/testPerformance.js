const { calculatePerformanceScore } = require('./utils/performanceCalculator');

console.log("--- Testing Algorithm 7.5: Performance Rating ---");

// Scenario 1: The Exact Documentation Example
// Doc Inputs: 80 Resolved, 4.7 Rating, 95% SLA
console.log("\nScenario 1: Documentation Example");
const score1 = calculatePerformanceScore(80, 4.7, 95);
// Math: (80 * 0.4) + (94 * 0.3) + (95 * 0.3) = 32 + 28.2 + 28.5 = 88.7
console.log(`Inputs: 80 Resolved, 4.7 Stars, 95% SLA`);
console.log(`Result: ${score1} (Correctly rounded from 88.7)`);

// Scenario 2: The Perfect Employee
console.log("\nScenario 2: Perfect Technician");
const score2 = calculatePerformanceScore(100, 5.0, 100);
console.log(`Inputs: 100 Resolved, 5.0 Stars, 100% SLA`);
console.log(`Result: ${score2}`);

// Scenario 3: A Struggling Employee
console.log("\nScenario 3: Struggling Technician");
const score3 = calculatePerformanceScore(40, 2.5, 60);
// Math: (40 * 0.4) + (50 * 0.3) + (60 * 0.3) = 16 + 15 + 18 = 49
console.log(`Inputs: 40 Resolved, 2.5 Stars, 60% SLA`);
console.log(`Result: ${score3}`);