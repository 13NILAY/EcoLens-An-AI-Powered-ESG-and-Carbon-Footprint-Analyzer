/**
 * Metric Extractor
 * 
 * Safely extracts ESG metrics from Flask API response
 * - Uses nullish coalescing (??) instead of logical OR (||)
 * - Never replaces missing values with 0
 * - Returns null for missing metrics
 */

/**
 * Extract all ESG metrics from Flask API response
 * @param {Object} flaskResponse - Response from Flask API
 * @returns {Object} Extracted metrics with null for missing values
 */
const extractMetrics = (flaskResponse) => {
  // If no valid response, return all nulls
  if (!flaskResponse || !flaskResponse.metrics) {
    return {
      // Environmental
      scope1: null,
      scope2: null,
      scope3: null,
      energy: null,
      water: null,
      waste: null,
      // Social
      genderDiversity: null,
      safetyIncidents: null,
      employeeWellbeing: null,
      // Governance
      dataBreaches: null,
      complaints: null,
    };
  }

  const metrics = flaskResponse.metrics;

  return {
    // Environmental Metrics (6)
    scope1: metrics.SCOPE_1?.value ?? null,
    scope2: metrics.SCOPE_2?.value ?? null,
    scope3: metrics.SCOPE_3?.value ?? null,
    energy: metrics.ENERGY_CONSUMPTION?.value ?? null,
    water: metrics.WATER_USAGE?.value ?? null,
    waste: metrics.WASTE_GENERATED?.value ?? null,

    // Social Metrics (3)
    genderDiversity: metrics.GENDER_DIVERSITY?.value ?? null,
    safetyIncidents: metrics.SAFETY_INCIDENTS?.value ?? null,
    employeeWellbeing: metrics.EMPLOYEE_WELLBEING?.value ?? null,

    // Governance Metrics (2)
    dataBreaches: metrics.DATA_BREACHES?.value ?? null,
    complaints: metrics.COMPLAINTS?.value ?? null,
  };
};

/**
 * Calculate total carbon footprint from scope emissions
 * Uses 0 as default for calculation purposes only
 */
const calculateCarbonFootprint = (scope1, scope2, scope3) => {
  const s1 = scope1 ?? 0;
  const s2 = scope2 ?? 0;
  const s3 = scope3 ?? 0;
  
  const total = s1 + s2 + s3;
  
  // Return null if all scopes are missing
  if (scope1 === null && scope2 === null && scope3 === null) {
    return null;
  }
  
  return total;
};

module.exports = {
  extractMetrics,
  calculateCarbonFootprint,
};