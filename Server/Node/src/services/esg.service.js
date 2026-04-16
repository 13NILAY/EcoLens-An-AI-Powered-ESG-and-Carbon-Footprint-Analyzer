/**
 * ESG Scoring Service
 * 
 * Calculates ESG scores based on extracted metrics
 * - Weighted scoring for Environmental metrics
 * - Log-scale normalization for emissions (Scope 1/2/3)
 * - Minimum data requirement to prevent unreliable scores
 * - Priority-weighted Social scoring (safety > diversity > wellbeing)
 * - Governance penalty logic for breaches and complaints
 * - Null-safe throughout — never replaces missing values with 0
 */

/**
 * Normalize a value to 0-100 scale (linear)
 * @param {number} value - Raw metric value
 * @param {number} min - Minimum expected value
 * @param {number} max - Maximum expected value
 * @param {boolean} inverse - True if lower is better (e.g., emissions)
 * @returns {number|null} Normalized score (0-100) or null
 */
const normalize = (value, min, max, inverse = false) => {
  if (value === null || value === undefined) return null;
  
  // Clamp value between min and max
  const clamped = Math.max(min, Math.min(max, value));
  
  // Normalize to 0-100
  let score = ((clamped - min) / (max - min)) * 100;
  
  // Inverse if lower is better
  if (inverse) {
    score = 100 - score;
  }
  
  return Math.round(score * 10) / 10; // Round to 1 decimal
};

/**
 * Log-scale normalization for emissions
 * More realistic: penalizes high emissions non-linearly
 * @param {number} value - Raw emission value
 * @param {number} max - Maximum expected value
 * @returns {number|null} Normalized score (0-100) or null
 */
const logNormalize = (value, max) => {
  if (value === null || value === undefined) return null;

  const score = 100 - (Math.log(value + 1) / Math.log(max + 1)) * 100;
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
};

/**
 * Calculate average of available values only
 * Returns null if all values are null
 */
const average = (values) => {
  const available = values.filter(v => v !== null && v !== undefined);
  if (available.length === 0) return null;
  
  const sum = available.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / available.length) * 10) / 10;
};

/**
 * Calculate Environmental Score
 * 
 * Uses weighted scoring with realistic maximum thresholds.
 * Emissions (Scope 1/2/3) use log-scale normalization.
 * Requires minimum 30% weight coverage to produce a score.
 * 
 * Weights:
 *   scope1: 0.25, scope2: 0.25, scope3: 0.30,
 *   energy: 0.10, water: 0.05, waste: 0.05
 */
const calculateEnvironmentalScore = (metrics) => {
  const weights = {
    scope1: 0.25,
    scope2: 0.25,
    scope3: 0.30,
    energy: 0.10,
    water: 0.05,
    waste: 0.05
  };

  let totalWeight = 0;
  let weightedSum = 0;

  const addScore = (value, min, max, inverse, weight, useLog = false) => {
    if (value !== null && value !== undefined) {
      const score = useLog
        ? logNormalize(value, max)
        : normalize(value, min, max, inverse);

      if (score !== null) {
        weightedSum += score * weight;
        totalWeight += weight;
      }
    }
  };

  // Updated realistic maximum thresholds:
  // Scope 1 & 2: up to 100,000 tCO2e (was 1000)
  // Scope 3: up to 500,000 tCO2e (was 5000)
  // Energy: up to 10,000,000 MJ (was 100,000)
  // Water: up to 1,000,000 kL (was 50,000)
  // Waste: up to 100,000 MT (was 1000)
  addScore(metrics.scope1 ?? null, 0, 100000, true, weights.scope1, true);
  addScore(metrics.scope2 ?? null, 0, 100000, true, weights.scope2, true);
  addScore(metrics.scope3 ?? null, 0, 500000, true, weights.scope3, true);
  addScore(metrics.energy ?? null, 0, 10000000, true, weights.energy);
  addScore(metrics.water ?? null, 0, 1000000, true, weights.water);
  addScore(metrics.waste ?? null, 0, 100000, true, weights.waste);

  // Minimum data requirement — need at least 30% weight coverage
  if (totalWeight === 0 || totalWeight < 0.3) {
    return null;
  }

  return Math.round((weightedSum / totalWeight) * 10) / 10;
};

/**
 * Calculate Social Score
 * 
 * Uses priority weighting: safety incidents (0.4), diversity (0.3), wellbeing (0.3)
 */
const calculateSocialScore = (metrics) => {
  const weights = {
    genderDiversity: 0.3,
    safetyIncidents: 0.4,
    employeeWellbeing: 0.3
  };

  let totalWeight = 0;
  let weightedSum = 0;

  // Gender Diversity (%) - ideal range 40-60%
  if (metrics.genderDiversity !== null && metrics.genderDiversity !== undefined) {
    const diversity = metrics.genderDiversity;
    let score;
    
    if (diversity >= 40 && diversity <= 60) {
      score = 100;
    } else if (diversity < 40) {
      score = normalize(diversity, 0, 40, false);
    } else {
      score = normalize(diversity, 60, 100, true);
    }
    
    if (score !== null) {
      weightedSum += score * weights.genderDiversity;
      totalWeight += weights.genderDiversity;
    }
  }

  // Safety Incidents - lower is better, benchmark 0-50
  if (metrics.safetyIncidents !== null && metrics.safetyIncidents !== undefined) {
    const score = normalize(metrics.safetyIncidents, 0, 50, true);
    if (score !== null) {
      weightedSum += score * weights.safetyIncidents;
      totalWeight += weights.safetyIncidents;
    }
  }

  // Employee Wellbeing (%) - higher is better, benchmark 0-100
  if (metrics.employeeWellbeing !== null && metrics.employeeWellbeing !== undefined) {
    const score = normalize(metrics.employeeWellbeing, 0, 100, false);
    if (score !== null) {
      weightedSum += score * weights.employeeWellbeing;
      totalWeight += weights.employeeWellbeing;
    }
  }

  if (totalWeight === 0) return null;

  return Math.round((weightedSum / totalWeight) * 10) / 10;
};

/**
 * Calculate Governance Score
 * 
 * Starts from average, then applies penalties:
 *   - Any data breaches: -20 points
 *   - More than 50 complaints: -10 points
 * Score is floored at 0.
 */
const calculateGovernanceScore = (metrics) => {
  const scores = [];

  // Data Breaches - lower is better, benchmark 0-20
  if (metrics.dataBreaches !== null && metrics.dataBreaches !== undefined) {
    scores.push(normalize(metrics.dataBreaches, 0, 20, true));
  }

  // Complaints - lower is better, benchmark 0-100
  if (metrics.complaints !== null && metrics.complaints !== undefined) {
    scores.push(normalize(metrics.complaints, 0, 100, true));
  }

  let governanceScore = average(scores);
  if (governanceScore === null) return null;

  // Penalty logic
  if (metrics.dataBreaches !== null && metrics.dataBreaches !== undefined && metrics.dataBreaches > 0) {
    governanceScore -= 20;
  }
  if (metrics.complaints !== null && metrics.complaints !== undefined && metrics.complaints > 50) {
    governanceScore -= 10;
  }

  governanceScore = Math.max(0, governanceScore);
  return Math.round(governanceScore * 10) / 10;
};

/**
 * Calculate overall ESG score and grade
 * @param {Object} metrics - Extracted metrics object
 * @returns {Object} ESG scores and grade
 */
const calculateESG = (metrics) => {
  console.log("📊 ESG Inputs:", metrics);

  const environmental = calculateEnvironmentalScore(metrics);
  const social = calculateSocialScore(metrics);
  const governance = calculateGovernanceScore(metrics);

  console.log("🌱 Environmental:", environmental);
  console.log("👥 Social:", social);
  console.log("🏛 Governance:", governance);

  const overall = average([environmental, social, governance]);

  let grade = null;
  if (overall !== null) {
    if (overall >= 80) grade = 'A';
    else if (overall >= 60) grade = 'B';
    else grade = 'C';
  }

  return {
    environmental,
    social,
    governance,
    overall,
    grade,
  };
};

module.exports = {
  calculateESG,
  normalize,
  logNormalize,
};