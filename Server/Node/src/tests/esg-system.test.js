/**
 * ESG System Test Suite
 * 
 * Run this to verify all components work correctly
 */

const { extractMetrics, calculateCarbonFootprint } = require('../utils/metricExtractor');
const { calculateESG } = require('../services/esg.service');

// Test utilities
const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    return false;
  }
  console.log(`✅ PASS: ${message}`);
  return true;
};

const assertEquals = (actual, expected, message) => {
  if (actual !== expected) {
    console.error(`❌ FAIL: ${message}`);
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual: ${actual}`);
    return false;
  }
  console.log(`✅ PASS: ${message}`);
  return true;
};

// ============================================
// Test 1: Metric Extraction
// ============================================
console.log("\n📦 Test 1: Metric Extraction\n");

const testMetricExtraction = () => {
  let passed = 0;
  let failed = 0;
  
  // Test 1.1: Complete data
  const completeResponse = {
    metrics: {
      SCOPE_1: { value: 500 },
      SCOPE_2: { value: 300 },
      SCOPE_3: { value: 1000 },
      ENERGY_CONSUMPTION: { value: 50000 },
      WATER_USAGE: { value: 25000 },
      WASTE_GENERATED: { value: 500 },
      GENDER_DIVERSITY: { value: 45 },
      SAFETY_INCIDENTS: { value: 5 },
      EMPLOYEE_WELLBEING: { value: 75 },
      DATA_BREACHES: { value: 1 },
      COMPLAINTS: { value: 10 }
    }
  };
  
  const result1 = extractMetrics(completeResponse);
  assertEquals(result1.scope1, 500, "Extracts scope1 correctly") ? passed++ : failed++;
  assertEquals(result1.genderDiversity, 45, "Extracts genderDiversity correctly") ? passed++ : failed++;
  
  // Test 1.2: Partial data
  const partialResponse = {
    metrics: {
      SCOPE_1: { value: 500 },
      GENDER_DIVERSITY: { value: 50 }
    }
  };
  
  const result2 = extractMetrics(partialResponse);
  assertEquals(result2.scope1, 500, "Extracts available scope1") ? passed++ : failed++;
  assertEquals(result2.scope2, null, "Returns null for missing scope2") ? passed++ : failed++;
  assertEquals(result2.water, null, "Returns null for missing water") ? passed++ : failed++;
  
  // Test 1.3: No data
  const result3 = extractMetrics(null);
  assertEquals(result3.scope1, null, "Returns null when no response") ? passed++ : failed++;
  
  // Test 1.4: Empty response
  const result4 = extractMetrics({});
  assertEquals(result4.scope1, null, "Returns null when empty response") ? passed++ : failed++;
  
  console.log(`\n📊 Metric Extraction: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
};

// ============================================
// Test 2: Carbon Footprint Calculation
// ============================================
console.log("\n⚗️  Test 2: Carbon Footprint Calculation\n");

const testCarbonFootprint = () => {
  let passed = 0;
  let failed = 0;
  
  // Test 2.1: All scopes available
  assertEquals(
    calculateCarbonFootprint(500, 300, 1000),
    1800,
    "Sums all three scopes"
  ) ? passed++ : failed++;
  
  // Test 2.2: Some scopes missing
  assertEquals(
    calculateCarbonFootprint(500, null, 1000),
    1500,
    "Treats null as 0 in sum"
  ) ? passed++ : failed++;
  
  // Test 2.3: All scopes missing
  assertEquals(
    calculateCarbonFootprint(null, null, null),
    null,
    "Returns null when all scopes missing"
  ) ? passed++ : failed++;
  
  console.log(`\n📊 Carbon Footprint: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
};

// ============================================
// Test 3: ESG Scoring
// ============================================
console.log("\n🎯 Test 3: ESG Scoring\n");

const testESGScoring = () => {
  let passed = 0;
  let failed = 0;
  
  // Test 3.1: Complete environmental data
  const metrics1 = {
    scope1: 500,
    scope2: 300,
    scope3: 1000,
    energy: 50000,
    water: 25000,
    waste: 500,
    genderDiversity: null,
    safetyIncidents: null,
    employeeWellbeing: null,
    dataBreaches: null,
    complaints: null
  };
  
  const scores1 = calculateESG(metrics1);
  assert(scores1.environmental !== null, "Calculates environmental score") ? passed++ : failed++;
  assert(scores1.environmental >= 0 && scores1.environmental <= 100, "Environmental score in range") ? passed++ : failed++;
  assertEquals(scores1.social, null, "Social score is null when no data") ? passed++ : failed++;
  assertEquals(scores1.governance, null, "Governance score is null when no data") ? passed++ : failed++;
  
  // Test 3.2: Complete social data
  const metrics2 = {
    scope1: null,
    scope2: null,
    scope3: null,
    energy: null,
    water: null,
    waste: null,
    genderDiversity: 45,
    safetyIncidents: 5,
    employeeWellbeing: 80,
    dataBreaches: null,
    complaints: null
  };
  
  const scores2 = calculateESG(metrics2);
  assertEquals(scores2.environmental, null, "Environmental null when no data") ? passed++ : failed++;
  assert(scores2.social !== null, "Calculates social score") ? passed++ : failed++;
  assert(scores2.social >= 0 && scores2.social <= 100, "Social score in range") ? passed++ : failed++;
  
  // Test 3.3: Gender diversity scoring (ideal range)
  const metrics3 = {
    scope1: null, scope2: null, scope3: null, energy: null, water: null, waste: null,
    genderDiversity: 50,
    safetyIncidents: null,
    employeeWellbeing: null,
    dataBreaches: null,
    complaints: null
  };
  
  const scores3 = calculateESG(metrics3);
  assertEquals(scores3.social, 100, "Gender diversity 50% = perfect score") ? passed++ : failed++;
  
  // Test 3.4: Grade assignment
  const metrics4 = {
    scope1: 100, scope2: 100, scope3: 500,
    energy: 10000, water: 5000, waste: 100,
    genderDiversity: 50, safetyIncidents: 2, employeeWellbeing: 90,
    dataBreaches: 0, complaints: 5
  };
  
  const scores4 = calculateESG(metrics4);
  assert(scores4.overall >= 80, "High performance gets score >= 80") ? passed++ : failed++;
  assertEquals(scores4.grade, 'A', "Score >= 80 gets grade A") ? passed++ : failed++;
  
  // Test 3.5: No data at all
  const metrics5 = {
    scope1: null, scope2: null, scope3: null,
    energy: null, water: null, waste: null,
    genderDiversity: null, safetyIncidents: null, employeeWellbeing: null,
    dataBreaches: null, complaints: null
  };
  
  const scores5 = calculateESG(metrics5);
  assertEquals(scores5.environmental, null, "No environmental data → null") ? passed++ : failed++;
  assertEquals(scores5.social, null, "No social data → null") ? passed++ : failed++;
  assertEquals(scores5.governance, null, "No governance data → null") ? passed++ : failed++;
  assertEquals(scores5.overall, null, "No data → overall null") ? passed++ : failed++;
  assertEquals(scores5.grade, null, "No data → grade null") ? passed++ : failed++;
  
  console.log(`\n📊 ESG Scoring: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
};

// ============================================
// Test 4: Integration Test
// ============================================
console.log("\n🔗 Test 4: Full Integration\n");

const testIntegration = () => {
  let passed = 0;
  let failed = 0;
  
  // Simulate Flask API response
  const flaskResponse = {
    status: "success",
    metrics: {
      SCOPE_1: { value: 600 },
      SCOPE_2: { value: 400 },
      SCOPE_3: { value: 2000 },
      ENERGY_CONSUMPTION: { value: 60000 },
      WATER_USAGE: { value: 30000 },
      WASTE_GENERATED: { value: 600 },
      GENDER_DIVERSITY: { value: 48 },
      SAFETY_INCIDENTS: { value: 8 },
      EMPLOYEE_WELLBEING: { value: 78 },
      DATA_BREACHES: { value: 2 },
      COMPLAINTS: { value: 12 }
    }
  };
  
  // Step 1: Extract metrics
  const metrics = extractMetrics(flaskResponse);
  assert(metrics.scope1 === 600, "Integration: Metrics extracted") ? passed++ : failed++;
  
  // Step 2: Calculate carbon footprint
  const carbon = calculateCarbonFootprint(metrics.scope1, metrics.scope2, metrics.scope3);
  assertEquals(carbon, 3000, "Integration: Carbon calculated") ? passed++ : failed++;
  
  // Step 3: Calculate ESG scores
  const scores = calculateESG(metrics);
  assert(scores.environmental !== null, "Integration: Environmental score calculated") ? passed++ : failed++;
  assert(scores.social !== null, "Integration: Social score calculated") ? passed++ : failed++;
  assert(scores.governance !== null, "Integration: Governance score calculated") ? passed++ : failed++;
  assert(scores.overall !== null, "Integration: Overall score calculated") ? passed++ : failed++;
  assert(scores.grade !== null, "Integration: Grade assigned") ? passed++ : failed++;
  
  console.log(`\n📊 Integration: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
};

// ============================================
// Test 5: Edge Cases
// ============================================
console.log("\n⚠️  Test 5: Edge Cases\n");

const testEdgeCases = () => {
  let passed = 0;
  let failed = 0;
  
  // Test 5.1: Zero values (should be treated as valid data, not null)
  const metrics1 = {
    scope1: 0, scope2: 0, scope3: 0,
    energy: 0, water: 0, waste: 0,
    genderDiversity: 0, safetyIncidents: 0, employeeWellbeing: 0,
    dataBreaches: 0, complaints: 0
  };
  
  const scores1 = calculateESG(metrics1);
  assert(scores1.environmental === 100, "Zero emissions = perfect environmental score") ? passed++ : failed++;
  assert(scores1.governance === 100, "Zero breaches/complaints = perfect governance") ? passed++ : failed++;
  
  // Test 5.2: Extreme high values
  const metrics2 = {
    scope1: 10000, scope2: 10000, scope3: 50000,
    energy: 1000000, water: 500000, waste: 10000,
    genderDiversity: 100, safetyIncidents: 100, employeeWellbeing: 0,
    dataBreaches: 50, complaints: 500
  };
  
  const scores2 = calculateESG(metrics2);
  assert(scores2.environmental <= 10, "Very high emissions = very low score") ? passed++ : failed++;
  assert(scores2.grade === 'C', "Poor performance = grade C") ? passed++ : failed++;
  
  // Test 5.3: Mixed data availability
  const metrics3 = {
    scope1: 500,
    scope2: null,
    scope3: null,
    energy: null,
    water: null,
    waste: null,
    genderDiversity: null,
    safetyIncidents: null,
    employeeWellbeing: null,
    dataBreaches: 0,
    complaints: null
  };
  
  const scores3 = calculateESG(metrics3);
  assert(scores3.environmental !== null, "Calculates with partial environmental data") ? passed++ : failed++;
  assertEquals(scores3.social, null, "Social null with no data") ? passed++ : failed++;
  assert(scores3.governance !== null, "Calculates with partial governance data") ? passed++ : failed++;
  
  console.log(`\n📊 Edge Cases: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
};

// ============================================
// Run All Tests
// ============================================
const runAllTests = () => {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║      ESG System Test Suite                     ║");
  console.log("╚════════════════════════════════════════════════╝");
  
  const results = [
    testMetricExtraction(),
    testCarbonFootprint(),
    testESGScoring(),
    testIntegration(),
    testEdgeCases()
  ];
  
  console.log("\n" + "═".repeat(50));
  console.log("\n📈 Final Results\n");
  
  const allPassed = results.every(r => r);
  
  if (allPassed) {
    console.log("✅ ALL TESTS PASSED! System is ready for production.\n");
  } else {
    console.log("❌ SOME TESTS FAILED! Please review the failures above.\n");
  }
  
  console.log("═".repeat(50) + "\n");
  
  return allPassed;
};

// Run tests if called directly
if (require.main === module) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = {
  runAllTests,
  testMetricExtraction,
  testCarbonFootprint,
  testESGScoring,
  testIntegration,
  testEdgeCases
};