/**
 * Database Migration Script
 * 
 * This script updates existing ESG data to use NULL instead of 0
 * for missing metrics and recalculates all ESG scores properly
 */

const pool = require("../config/db");
const { calculateESG } = require("../services/esg.service");
const { extractMetrics } = require("../utils/metricExtractor");

/**
 * Convert 0 values to NULL for metrics that should be NULL
 */
const cleanMetricValues = async () => {
  console.log("🧹 Cleaning metric values...");
  
  // This is optional - only run if you want to convert existing 0s to NULLs
  // In most cases, you'll want to keep existing data and only apply new logic to new uploads
  
  const metricsToClean = [
    'SCOPE_1', 'SCOPE_2', 'SCOPE_3',
    'ENERGY_CONSUMPTION', 'WATER_USAGE', 'WASTE_GENERATED',
    'GENDER_DIVERSITY', 'SAFETY_INCIDENTS', 'EMPLOYEE_WELLBEING',
    'DATA_BREACHES', 'COMPLAINTS'
  ];
  
  let cleanedCount = 0;
  
  for (const metricName of metricsToClean) {
    const result = await pool.query(
      `UPDATE esg_metrics 
       SET metric_value = NULL 
       WHERE metric_name = $1 AND metric_value = 0`,
      [metricName]
    );
    
    cleanedCount += result.rowCount;
  }
  
  console.log(`✅ Cleaned ${cleanedCount} metric values (0 → NULL)`);
};

/**
 * Recalculate ESG scores for all reports
 */
const recalculateAllScores = async () => {
  console.log("🔄 Recalculating ESG scores...");
  
  // Get all report IDs
  const reportsResult = await pool.query(
    "SELECT DISTINCT report_id FROM esg_metrics ORDER BY report_id"
  );
  
  const reportIds = reportsResult.rows.map(r => r.report_id);
  console.log(`📊 Found ${reportIds.length} reports to recalculate`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const reportId of reportIds) {
    try {
      // Get all metrics for this report
      const metricsResult = await pool.query(
        `SELECT metric_name, metric_value 
         FROM esg_metrics 
         WHERE report_id = $1`,
        [reportId]
      );
      
      // Convert to metrics object
      const metricsData = {};
      metricsResult.rows.forEach(row => {
        metricsData[row.metric_name] = {
          value: row.metric_value
        };
      });
      
      // Map to expected format
      const metrics = {
        scope1: metricsData.SCOPE_1?.value ?? null,
        scope2: metricsData.SCOPE_2?.value ?? null,
        scope3: metricsData.SCOPE_3?.value ?? null,
        energy: metricsData.ENERGY_CONSUMPTION?.value ?? null,
        water: metricsData.WATER_USAGE?.value ?? null,
        waste: metricsData.WASTE_GENERATED?.value ?? null,
        genderDiversity: metricsData.GENDER_DIVERSITY?.value ?? null,
        safetyIncidents: metricsData.SAFETY_INCIDENTS?.value ?? null,
        employeeWellbeing: metricsData.EMPLOYEE_WELLBEING?.value ?? null,
        dataBreaches: metricsData.DATA_BREACHES?.value ?? null,
        complaints: metricsData.COMPLAINTS?.value ?? null,
      };
      
      // Calculate new scores
      const scores = calculateESG(metrics);
      
      // Update in database
      await pool.query(
        `UPDATE esg_scores 
         SET environmental = $1,
             social = $2,
             governance = $3,
             overall_score = $4,
             grade = $5
         WHERE report_id = $6`,
        [
          scores.environmental,
          scores.social,
          scores.governance,
          scores.overall,
          scores.grade,
          reportId
        ]
      );
      
      successCount++;
      
      if (successCount % 10 === 0) {
        console.log(`  ⏳ Processed ${successCount}/${reportIds.length} reports...`);
      }
      
    } catch (error) {
      console.error(`  ❌ Error recalculating report ${reportId}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`✅ Recalculation complete: ${successCount} success, ${errorCount} errors`);
};

/**
 * Add metric_unit column if it doesn't exist
 */
const addMetricUnitColumn = async () => {
  console.log("🔧 Checking metric_unit column...");
  
  try {
    // Check if column exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'esg_metrics' 
      AND column_name = 'metric_unit'
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log("  Adding metric_unit column...");
      await pool.query(`
        ALTER TABLE esg_metrics 
        ADD COLUMN metric_unit VARCHAR(20)
      `);
      console.log("  ✅ Column added");
      
      // Update existing records with units
      const unitMapping = {
        'SCOPE_1': 'tCO2e',
        'SCOPE_2': 'tCO2e',
        'SCOPE_3': 'tCO2e',
        'CARBON_EMISSIONS': 'tCO2e',
        'ENERGY_CONSUMPTION': 'MJ',
        'WATER_USAGE': 'KL',
        'WASTE_GENERATED': 'MT',
        'GENDER_DIVERSITY': '%',
        'EMPLOYEE_WELLBEING': '%'
      };
      
      for (const [metricName, unit] of Object.entries(unitMapping)) {
        await pool.query(
          `UPDATE esg_metrics 
           SET metric_unit = $1 
           WHERE metric_name = $2`,
          [unit, metricName]
        );
      }
      
      console.log("  ✅ Units populated");
    } else {
      console.log("  ✅ Column already exists");
    }
  } catch (error) {
    console.error("  ❌ Error adding column:", error.message);
  }
};

/**
 * Main migration function
 */
const runMigration = async () => {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║      ESG Database Migration Script            ║");
  console.log("╚════════════════════════════════════════════════╝\n");
  
  try {
    // Step 1: Add metric_unit column if needed
    await addMetricUnitColumn();
    
    console.log("\n" + "─".repeat(50));
    
    // Step 2: Clean metric values (optional)
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      readline.question(
        "\n⚠️  Do you want to convert existing 0 values to NULL? (y/N): ",
        resolve
      );
    });
    
    readline.close();
    
    if (answer.toLowerCase() === 'y') {
      await cleanMetricValues();
    } else {
      console.log("⏭️  Skipping value cleanup");
    }
    
    console.log("\n" + "─".repeat(50));
    
    // Step 3: Recalculate all ESG scores
    await recalculateAllScores();
    
    console.log("\n╔════════════════════════════════════════════════╗");
    console.log("║      ✅ Migration Complete!                    ║");
    console.log("╚════════════════════════════════════════════════╝\n");
    
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  runMigration,
  cleanMetricValues,
  recalculateAllScores,
  addMetricUnitColumn
};