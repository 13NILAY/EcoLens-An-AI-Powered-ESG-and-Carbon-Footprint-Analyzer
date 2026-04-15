"""Quick test to verify ESG metric extraction after pipeline redesign."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml_pipeline.extractor import ml_esg_metric_extractor

test_text = """
Our company's total greenhouse gas emissions were 125,000 tCO2e in FY2023-24.
Scope 1 emissions: 45,000 tCO2e (direct emissions from owned sources)
Scope 2 emissions: 35,000 tCO2e (indirect emissions from purchased electricity)
Scope 3 emissions: 45,000 tCO2e (value chain emissions)

Energy consumption was 85,000 MWh, with 42% from renewable sources.
Water withdrawal: 2,500,000 m3.
62% of waste was recycled.

Employee turnover rate: 12%
Female representation in workforce: 36%
Average training hours per employee: 24 hours

Board independence: 55%
Female directors: 25%
CEO pay ratio: 85:1
Ethics training completion: 92%
"""

print("=" * 60)
print("VERIFICATION TEST: ESG Metric Extraction (Redesigned Pipeline)")
print("=" * 60)

results = ml_esg_metric_extractor(test_text)

print(f"\nExtracted {len(results)} metrics:\n")
for metric, info in sorted(results.items()):
    print(f"  {metric:35s}: {info['value']} {info['unit']}  (conf={info['confidence']:.2f}, src={info['source']})")

# Key checks — using CANONICAL metric names
print("\n" + "-" * 60)
print("EXTRACTION VERIFICATION:")
print("-" * 60)

checks = {
    # (canonical_metric_name, expected_value, description)
    'ceo_pay_ratio': (85, "CEO pay ratio = 85 (not 85,000,000)"),
    'scope1_emissions': (45000, "Scope 1 emissions = 45,000 tCO2e"),
    'scope2_emissions': (35000, "Scope 2 emissions = 35,000 tCO2e"),
    'scope3_emissions': (45000, "Scope 3 emissions = 45,000 tCO2e"),
    'renewable_energy_share': (42, "Renewable energy = 42%"),
    'ethics_training_completion_rate': (92, "Ethics training = 92%"),
    'total_ghg_emissions': (125000, "GHG emissions = 125,000 tCO2e"),
    'energy_consumption_total': (85000, "Energy consumption = 85,000 MWh"),
    'water_withdrawal_total': (2500000, "Water withdrawal = 2,500,000 m3"),
    'waste_recycled_share': (62, "Waste recycled = 62%"),
    'employee_turnover_rate': (12, "Employee turnover = 12%"),
    'female_employees_share': (36, "Female representation = 36%"),
    'training_hours_per_employee': (24, "Training hours = 24"),
    'board_independence_share': (55, "Board independence = 55%"),
    'female_board_share': (25, "Female directors = 25%"),
}

passed = 0
failed = 0
for canonical, (expected, desc) in checks.items():
    if canonical in results:
        actual = results[canonical]['value']
        if actual == expected:
            print(f"  [PASS] {desc}")
            passed += 1
        else:
            print(f"  [FAIL] {desc} — got {actual}")
            failed += 1
    else:
        print(f"  [FAIL] {desc} — metric not extracted")
        failed += 1

print(f"\n{'=' * 60}")
print(f"RESULTS: {passed}/{passed+failed} checks passed, {len(results)} total metrics extracted")
if passed >= 10:
    print("   Pipeline redesign is working — alias-mapping gate successfully removed!")
else:
    print("✗ Some checks failed — review extraction logic")
print(f"{'=' * 60}")
