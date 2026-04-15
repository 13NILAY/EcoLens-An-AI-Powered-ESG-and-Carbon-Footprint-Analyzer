/**
 * Metrics Service
 * 
 * Handles database operations for ESG metrics and scores
 */

const pool = require("../config/db");

/**
 * Save individual metrics to database
 * @param {number} reportId - Report ID
 * @param {Object} metrics - Extracted metrics object
 * @param {number} carbonFootprint - Calculated carbon footprint
 */
const saveMetrics = async (reportId, metrics, carbonFootprint) => {
  const metricsList = [
    // Environmental Metrics
    { name: "SCOPE_1", value: metrics.scope1, unit: "tCO2e" },
    { name: "SCOPE_2", value: metrics.scope2, unit: "tCO2e" },
    { name: "SCOPE_3", value: metrics.scope3, unit: "tCO2e" },
    { name: "CARBON_EMISSIONS", value: carbonFootprint, unit: "tCO2e" },
    { name: "ENERGY_CONSUMPTION", value: metrics.energy, unit: "MJ" },
    { name: "WATER_USAGE", value: metrics.water, unit: "KL" },
    { name: "WASTE_GENERATED", value: metrics.waste, unit: "MT" },
    
    // Social Metrics
    { name: "GENDER_DIVERSITY", value: metrics.genderDiversity, unit: "%" },
    { name: "SAFETY_INCIDENTS", value: metrics.safetyIncidents, unit: null },
    { name: "EMPLOYEE_WELLBEING", value: metrics.employeeWellbeing, unit: "%" },
    
    // Governance Metrics
    { name: "DATA_BREACHES", value: metrics.dataBreaches, unit: null },
    { name: "COMPLAINTS", value: metrics.complaints, unit: null },
  ];

  // Insert all metrics (including null values)
  for (const metric of metricsList) {
    await pool.query(
      `INSERT INTO esg_metrics (report_id, metric_name, metric_value, metric_unit)
       VALUES ($1, $2, $3, $4)`,
      [reportId, metric.name, metric.value, metric.unit]
    );
  }
};

/**
 * Save ESG scores to database
 * @param {number} reportId - Report ID
 * @param {Object} scores - ESG scores object
 */
const saveESGScores = async (reportId, scores) => {
  await pool.query(
    `INSERT INTO esg_scores 
     (report_id, environmental, social, governance, overall_score, grade)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      reportId,
      scores.environmental,
      scores.social,
      scores.governance,
      scores.overall,
      scores.grade,
    ]
  );
};

/**
 * Get all metrics for a report
 * @param {number} reportId - Report ID
 * @returns {Object} Metrics object
 */
const getReportMetrics = async (reportId) => {
  const result = await pool.query(
    `SELECT metric_name, metric_value, metric_unit
     FROM esg_metrics
     WHERE report_id = $1`,
    [reportId]
  );

  const metrics = {};
  result.rows.forEach((row) => {
    metrics[row.metric_name] = {
      value: row.metric_value !== null ? Number(row.metric_value) : null,
      unit: row.metric_unit,
    };
  });

  return metrics;
};

/**
 * Get ESG scores for a report
 * @param {number} reportId - Report ID
 * @returns {Object} ESG scores
 */
const getReportScores = async (reportId) => {
  const result = await pool.query(
    `SELECT environmental, social, governance, overall_score, grade, created_at
     FROM esg_scores
     WHERE report_id = $1`,
    [reportId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    environmental: row.environmental,
    social: row.social,
    governance: row.governance,
    overall: row.overall_score,
    grade: row.grade,
    createdAt: row.created_at,
  };
};

module.exports = {
  saveMetrics,
  saveESGScores,
  getReportMetrics,
  getReportScores,
};