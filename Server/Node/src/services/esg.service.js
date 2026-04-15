/**
 * ESG Scoring Service
 * 
 * Calculates ESG scores based on extracted metrics
 * - Only uses available metrics (skips null values)
 * - Normalizes each metric to 0-100 scale
 * - Returns null if no metrics are available for a category
 */

/**
 * Normalize a value to 0-100 scale
 * @param {number} value - Raw metric value
 * @param {number} min - Minimum expected value
 * @param {number} max - Maximum expected value
 * @param {boolean} inverse - True if lower is better (e.g., emissions)
 * @returns {number} Normalized score (0-100)
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
 * Calculate average of available values only
 */
const average = (values) => {
  const available = values.filter(v => v !== null && v !== undefined);
  if (available.length === 0) return null;
  
  const sum = available.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / available.length) * 10) / 10;
};

/**
 * Calculate Environmental Score
 * Metrics: scope1, scope2, scope3, energy, water, waste
 * Lower is better for emissions
 */
const calculateEnvironmentalScore = (metrics) => {
  const scores = [];

  // Scope 1 Emissions (tCO2e) - lower is better
  // Benchmark: 0-1000 tons
  if (metrics.scope1 !== null) {
    scores.push(normalize(metrics.scope1, 0, 1000, true));
  }

  // Scope 2 Emissions (tCO2e) - lower is better
  // Benchmark: 0-1000 tons
  if (metrics.scope2 !== null) {
    scores.push(normalize(metrics.scope2, 0, 1000, true));
  }

  // Scope 3 Emissions (tCO2e) - lower is better
  // Benchmark: 0-5000 tons
  if (metrics.scope3 !== null) {
    scores.push(normalize(metrics.scope3, 0, 5000, true));
  }

  // Energy Consumption (MJ) - lower is better
  // Benchmark: 0-100,000 MJ
  if (metrics.energy !== null) {
    scores.push(normalize(metrics.energy, 0, 100000, true));
  }

  // Water Usage (KL) - lower is better
  // Benchmark: 0-50,000 KL
  if (metrics.water !== null) {
    scores.push(normalize(metrics.water, 0, 50000, true));
  }

  // Waste Generated (MT) - lower is better
  // Benchmark: 0-1000 MT
  if (metrics.waste !== null) {
    scores.push(normalize(metrics.waste, 0, 1000, true));
  }

  return average(scores);
};

/**
 * Calculate Social Score
 * Metrics: genderDiversity, safetyIncidents, employeeWellbeing
 */
const calculateSocialScore = (metrics) => {
  const scores = [];

  // Gender Diversity (%) - ideal range 40-60%
  if (metrics.genderDiversity !== null) {
    const diversity = metrics.genderDiversity;
    let score;
    
    if (diversity >= 40 && diversity <= 60) {
      // Perfect range
      score = 100;
    } else if (diversity < 40) {
      // Score decreases as it gets further from 40
      score = normalize(diversity, 0, 40, false);
    } else {
      // Score decreases as it gets further from 60
      score = normalize(diversity, 60, 100, true);
    }
    
    scores.push(score);
  }

  // Safety Incidents - lower is better
  // Benchmark: 0-50 incidents
  if (metrics.safetyIncidents !== null) {
    scores.push(normalize(metrics.safetyIncidents, 0, 50, true));
  }

  // Employee Wellbeing (%) - higher is better
  // Benchmark: 0-100%
  if (metrics.employeeWellbeing !== null) {
    scores.push(normalize(metrics.employeeWellbeing, 0, 100, false));
  }

  return average(scores);
};

/**
 * Calculate Governance Score
 * Metrics: dataBreaches, complaints
 */
const calculateGovernanceScore = (metrics) => {
  const scores = [];

  // Data Breaches - lower is better
  // Benchmark: 0-20 breaches
  if (metrics.dataBreaches !== null) {
    scores.push(normalize(metrics.dataBreaches, 0, 20, true));
  }

  // Complaints - lower is better
  // Benchmark: 0-100 complaints
  if (metrics.complaints !== null) {
    scores.push(normalize(metrics.complaints, 0, 100, true));
  }

  return average(scores);
};

/**
 * Calculate overall ESG score and grade
 * @param {Object} metrics - Extracted metrics object
 * @returns {Object} ESG scores and grade
 */
const calculateESG = (metrics) => {
  // Calculate category scores
  const environmental = calculateEnvironmentalScore(metrics);
  const social = calculateSocialScore(metrics);
  const governance = calculateGovernanceScore(metrics);

  // Calculate overall score (average of available category scores)
  const overall = average([environmental, social, governance]);

  // Calculate grade
  let grade = null;
  if (overall !== null) {
    if (overall >= 80) {
      grade = 'A';
    } else if (overall >= 60) {
      grade = 'B';
    } else {
      grade = 'C';
    }
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
  normalize, // Export for testing
};