"""
ESG EXTRACTION - PDF EVALUATION SCRIPT v11.0 (ANNEXURE SUMMARY SCANNER)
================================================================================

FULL MERGE of v9.0 (Recovery Mode + Multi-Stage) and v11.0 (Annexure Scanner).
All fixes from both versions are retained and integrated.

── v9.0 FIXES (FIX 33–49) ────────────────────────────────────────────────────
    FIX 33: TABLE OVERRIDE — If metric exists in table, ignore paragraph values
    FIX 34: TOTAL ROW DETECTION — Only accept total/grand total/overall or last row
    FIX 35: VALUE SCALE VALIDATION — Minimum thresholds (RELAXED in Stage 2)
    FIX 36: STRICT UNIT VALIDATION — Metric-unit compatibility
    FIX 37: PARAGRAPH FILTER — Reject intervention/saved/reduced/initiative
    FIX 38: ESG SCORE HARD FILTER — Only explicit ESG score/rating
    FIX 39: CONFIDENCE CORRECTION — Source-based confidence caps
    FIX 40: TABLE PARSER RELAXATION — Accept scope/energy/water/waste rows
    FIX 41: FALLBACK IF TABLE FAILS — Re-enable paragraph if table=0
    FIX 42: PARTIAL TABLE ACCEPTANCE — First numeric if header unclear
    FIX 43: RELAXED VALUE THRESHOLDS — Lower minimums for Stage 2
    FIX 44: DISABLE TABLE OVERRIDE WHEN EMPTY — Don't block text if table empty
    FIX 45: DEBUG LOGGING — Print rejection reasons
    FIX 46: MULTI-STAGE EXTRACTION — Progressive relaxation strategy
    FIX 47: TABLE RECONSTRUCTION — Structured extraction pipeline
    FIX 48: 11-METRIC COMPLETENESS — Track all target metrics
    FIX 49: METRIC EXTENSIONS — Plugin for social/governance metrics

── v10.0 FIXES (FIX 50–55) ───────────────────────────────────────────────────
    FIX 50: ENERGY — Grand total formula row (A+B+C+D+E+F) matched first;
             single-letter sub-rows like "(A)" rejected when formula row exists.
    FIX 51: WASTE — Grand-total formula row "Total (A+B+C+D+E+F+G+H)" matched
             at highest priority before falling back to aggregation.
    FIX 52: SCOPE 1 — Component regex handles all Unicode dash variants
             (–, —, \u2013, \u2014). Inline Scope 1 search also improved.
    FIX 53: DATA BREACHES — Page-level nil scan runs before numeric extraction.
    FIX 54: COMPLAINTS — Extended internal-complaint reject pattern; minimum
             count guard (>= 1,000) for customer complaint rows.
    FIX 55: SAFETY_INCIDENTS (Stage-4 cross-contamination) — Extension plugin
             conflict guard; rows matching DATA_BREACHES or COMPLAINTS patterns
             are rejected for SAFETY_INCIDENTS.

── v11.0 FIXES (FIX 56) ──────────────────────────────────────────────────────
    FIX 56: ANNEXURE / SUMMARY TABLE SCANNER (Stage 0.5)
             Detects auditor-verified performance data summary tables near the
             end of ESG/BRSR reports (Annexure, GRI Index, ESG Data Summary,
             KPI tables). Assigns source_type='annexure' with confidence=0.97.
             Runs BEFORE Stage 0 so correct values override body extraction.

── MERGE-ONLY IMPROVEMENTS ───────────────────────────────────────────────────
    M-1: _zero_breach_result static helper in TableReconstructor (from v9.0)
    M-2: Two-pass nil scan in _extract_data_breaches (row-level + page-level)
    M-3: Customer complaint minimum raised to 1,000 (v9.0) for reliability
    M-4: Richer _print_summary with Target Achievements + Top 5 Metrics
    M-5: Full Stage-4 cross-contamination guard (data_breach / complaints)
    M-6: Broader Unicode dash pattern in _extract_scope1_from_components
    M-7: METRIC_SYNONYMS expanded with formula-row labels (FIX 50/51)
    M-8: ENERGY_CONSUMPTION validator max widened to 100_000_000_000 (GJ scale)
    M-9: COMPLAINTS validator max widened to 10_000_000

Usage:
    python evaluate_on_pdf.py --pdf_path "path/to/esg_report.pdf"
"""

import json
import argparse
from pathlib import Path
from typing import List, Dict, Tuple, Optional, Set
import re
from dataclasses import dataclass, asdict
from collections import defaultdict
from difflib import SequenceMatcher


# PDF extraction
try:
    import pdfplumber
    PDF_AVAILABLE = True
except ImportError:
    print("     Warning: pdfplumber not installed. Install with: pip install pdfplumber")
    PDF_AVAILABLE = False

# Model inference
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    AutoModelForSequenceClassification
)
import numpy as np


# ============================================================================
# CONSTANTS & CONFIGURATION
# ============================================================================

TARGET_METRICS: Set[str] = {
    'SCOPE_1',
    'SCOPE_2',
    'SCOPE_3',
    'ENERGY_CONSUMPTION',
    'WATER_USAGE',
    'WASTE_GENERATED',
    'GENDER_DIVERSITY',
    'SAFETY_INCIDENTS',
    'EMPLOYEE_WELLBEING',
    'DATA_BREACHES',
    'COMPLAINTS',
}

SOURCE_PRIORITY: Dict[str, float] = {
    'annexure':            1.1,   # FIX 56: auditor-verified summary table — highest trust
    'table_reconstructed': 1.0,
    'table':               0.9,
    'text':                0.7,
    'ner_model':           0.6,
    'classifier':          0.5,
    'plugin':              0.6,
    'derived':             0.55,
    'paragraph':           0.7,
}

VALID_UNITS: Set[str] = {
    "tCO2e", "Mt CO2e", "ktCO2e", "kgCO2", "kgCO2e", "tCO2", "tonnes CO2",
    "MtCO2e", "TCO2e",
    "GWh", "MWh", "kWh", "Mn kWh", "MJ", "GJ", "TJ", "PJ",
    "GJ/tonne", "MJ/unit", "kWh/unit",
    "m³", "m3", "KL", "kilolitres", "kiloliters", "liters", "litres",
    "ML", "GL", "kl", "Ml",
    "kg", "tonnes", "t", "MT", "kt", "g",
    "%",
    "crore", "lakh",
}

UNIT_NORMALIZATION: Dict[str, str] = {
    'tonnes': 'tCO2e', 'tons': 'tCO2e', 'tco2e': 'tCO2e', 'tco2': 'tCO2',
    'mtco2e': 'MtCO2e', 'million tonnes': 'Mt CO2e', 'mt co2e': 'Mt CO2e',
    'ktco2e': 'ktCO2e', 'kgco2': 'kgCO2', 'kgco2e': 'kgCO2e',
    'tonnes co2': 'tonnes CO2', 'tcO2e': 'tCO2e',
    'gwh': 'GWh', 'mwh': 'MWh', 'kwh': 'kWh',
    'mj': 'MJ', 'gj': 'GJ', 'tj': 'TJ', 'pj': 'PJ',
    'mn kwh': 'Mn kWh', 'million kwh': 'Mn kWh',
    'gj/tonne': 'GJ/tonne', 'mj/unit': 'MJ/unit', 'kwh/unit': 'kWh/unit',
    'm3': 'm³', 'cubic meters': 'm³', 'cubic metres': 'm³',
    'kl': 'KL', 'kilolitres': 'KL', 'kiloliters': 'KL',
    'ml': 'ML', 'gl': 'GL',
    'liters': 'liters', 'litres': 'litres',
    '%': '%', 'percent': '%', 'percentage': '%',
    'mt': 'MT', 'metric tonnes': 'MT', 'metric tons': 'MT',
    'kt': 'kt', 'kg': 'kg', 't': 't', 'g': 'g',
    'fte': 'FTE', 'employees': 'employees',
    'hours': 'hours', 'hours/employee': 'hours/employee',
    'crore': 'crore', 'lakh': 'lakh',
}

STRICT_UNIT_MAP: Dict[str, Set[str]] = {
    'SCOPE_1': {'tCO2e', 'Mt CO2e', 'MtCO2e', 'ktCO2e', 'tCO2', 'tonnes CO2', 'tonnes', 't', 'MT'},
    'SCOPE_2': {'tCO2e', 'Mt CO2e', 'MtCO2e', 'ktCO2e', 'tCO2', 'tonnes CO2', 'tonnes', 't', 'MT'},
    'SCOPE_3': {'tCO2e', 'Mt CO2e', 'MtCO2e', 'ktCO2e', 'tCO2', 'tonnes CO2', 'tonnes', 't', 'MT'},
    'ENERGY_CONSUMPTION': {'MJ', 'GJ', 'TJ', 'PJ', 'kWh', 'MWh', 'GWh', 'Mn kWh'},
    'WATER_USAGE': {'KL', 'm³', 'm3', 'ML', 'GL'},
    'WASTE_GENERATED': {'tonnes', 'MT', 'kt', 't', 'kg'},
    'GENDER_DIVERSITY': {'%'},
    'SAFETY_INCIDENTS': set(),
    'EMPLOYEE_WELLBEING': {'%'},
    'DATA_BREACHES': set(),
    'COMPLAINTS': set(),
}

METRIC_KEYWORDS: Dict[str, List[str]] = {
    'SCOPE_1': ['emissions', 'co2', 'ghg', 'carbon', 'scope 1', 'scope1', 'direct emissions'],
    'SCOPE_2': ['emissions', 'co2', 'ghg', 'carbon', 'scope 2', 'scope2', 'indirect emissions'],
    'SCOPE_3': ['emissions', 'co2', 'ghg', 'carbon', 'scope 3', 'scope3', 'value chain'],
    'ENERGY_CONSUMPTION': ['energy', 'electricity', 'power', 'consumption', 'kwh', 'mwh', 'gwh'],
    'WATER_USAGE': ['water', 'withdrawal', 'discharge', 'consumption'],
    'WASTE_GENERATED': ['waste', 'generated', 'disposal', 'solid waste'],
    'GENDER_DIVERSITY': ['gender', 'diversity', 'women', 'female', 'male', 'workforce composition'],
    'SAFETY_INCIDENTS': ['safety', 'incident', 'injury', 'accident', 'fatality', 'ltifr', 'lost time'],
    'EMPLOYEE_WELLBEING': ['wellbeing', 'well-being', 'training', 'turnover', 'attrition', 'satisfaction'],
    'DATA_BREACHES': ['data breach', 'cyber', 'security incident', 'privacy', 'data leak'],
    'COMPLAINTS': ['complaint', 'grievance', 'whistleblower', 'ethics violation'],
}

UNITLESS_ALLOWED_METRICS: Set[str] = {'SAFETY_INCIDENTS', 'DATA_BREACHES', 'COMPLAINTS'}

TEMPORAL_KEYWORDS: List[str] = [
    'compared', 'previous', 'last year', 'prior year', 'preceding',
    'increase', 'decrease', 'growth', 'decline', 'change',
]

INVALID_CONTEXT_WORDS: Set[str] = {
    'phone', 'email', 'cin', 'code', 'section', 'page', 'id', 'number',
    'tel', 'fax', 'contact', 'reference'
}
_INVALID_CONTEXT_RE = re.compile(
    r'\b(' + '|'.join(re.escape(w) for w in INVALID_CONTEXT_WORDS) + r')\b',
    re.IGNORECASE,
)

NOISE_VALUES: Set[int] = {1, 2, 3, 4, 5, 10}

GENERIC_ENTITY_WORDS: Set[str] = {
    'total', 'number', 'energy', 'water', 'waste', 'carbon', 'scope',
    'paid', 'value', 'women', 'employee', 'os', 'km',
}

INTENSITY_PATTERNS: List[re.Pattern] = [
    re.compile(
        r'(?<!\w)\bper\s+(employee|fte|worker|revenue|unit\b|tonne\b|kwh\b|mwh\b|gwh\b|'
        r'product|barrel|ton\b|kg\b|m2|sqft|capita|head)',
        re.IGNORECASE,
    ),
    re.compile(r'\bintensity\b', re.IGNORECASE),
    re.compile(r'\bratio\b', re.IGNORECASE),
    re.compile(r'\breduced?\s+by\b', re.IGNORECASE),
    re.compile(r'\bchange\s+of\b', re.IGNORECASE),
    re.compile(r'\brate\s+of\b', re.IGNORECASE),
    re.compile(r'\btarget\b', re.IGNORECASE),
    re.compile(r'\breduction\b', re.IGNORECASE),
    re.compile(r'\bprojection\b', re.IGNORECASE),
    re.compile(r'\bforecast\b', re.IGNORECASE),
    re.compile(
        r'[\d.]+\s*(?:tCO2e?|kg|MJ|GJ|kWh)\s*/\s*(?:unit|tonne|employee|revenue|kwh|mwh)',
        re.IGNORECASE,
    ),
]

PARAGRAPH_REJECT_KEYWORDS = re.compile(
    r'\b(intervention|saved|reduced|initiative)\b', re.IGNORECASE
)

_SCI_NOTATION_RE = re.compile(r'\b\d+\.?\d*[eE][+-]?\d+\b')

_YEAR_HEADER_RE = re.compile(
    r'\b(?:FY\s*)?(?:20\d{2}|19\d{2})'
    r'|(?:FY\s*\d{2})\b',
    re.IGNORECASE,
)

CTX_SCORE_WEIGHTS = {
    'total':       +3,
    'metric_kw':   +3,
    'unit_match':  +2,
    'intensity':   -3,
    'target_word': -2,
}
_TARGET_WORDS_RE = re.compile(
    r'\b(target|reduction|projection|forecast|plan(?:ned)?|goal|objective)\b',
    re.IGNORECASE,
)

CANONICAL_UNIT: Dict[str, str] = {
    'tCO2e':    'tCO2e', 'tCO2':   'tCO2e', 'TCO2e':   'tCO2e',
    'tonnes CO2': 'tCO2e', 'tonnes': 'tCO2e', 't': 'tCO2e',
    'MT':       'tCO2e', 'kt':    'tCO2e',
    'kgCO2':    'tCO2e', 'kgCO2e': 'tCO2e',
    'ktCO2e':   'ktCO2e', 'MtCO2e':   'MtCO2e', 'Mt CO2e':  'MtCO2e',
    'MJ':  'MJ', 'GJ': 'GJ', 'TJ': 'TJ', 'PJ': 'PJ',
    'kWh': 'kWh', 'MWh': 'MWh', 'GWh': 'GWh', 'Mn kWh': 'Mn kWh',
    'GJ/tonne': 'GJ/tonne', 'MJ/unit': 'MJ/unit', 'kWh/unit': 'kWh/unit',
    'm³': 'KL', 'm3': 'KL', 'KL': 'KL', 'kl': 'KL',
    'kilolitres': 'KL', 'kiloliters': 'KL',
    'ML': 'ML', 'GL': 'GL',
    'liters': 'KL', 'litres': 'KL',
    'kg': 'kg',
    '%': '%', 'crore': 'crore', 'lakh': 'lakh',
    'UNKNOWN': 'UNKNOWN',
}

KG_TO_TONNE_METRICS: Set[str] = {'SCOPE_1', 'SCOPE_2', 'SCOPE_3', 'WASTE_GENERATED'}

MIN_VALUES = {
    'SCOPE_1': 500,
    'SCOPE_2': 500,
    'SCOPE_3': 5000,
    'WATER_USAGE': 50000,
    'ENERGY_CONSUMPTION': 1_000_000,
    'WASTE_GENERATED': 500,
    'GENDER_DIVERSITY': 0,
    'SAFETY_INCIDENTS': 0,
    'EMPLOYEE_WELLBEING': 0,
    'DATA_BREACHES': 0,
    'COMPLAINTS': 0,
}

RELAXED_MIN_VALUES = {
    'SCOPE_1': 100,
    'SCOPE_2': 100,
    'SCOPE_3': 1000,
    'WATER_USAGE': 50000,
    'ENERGY_CONSUMPTION': 1_000_000,
    'WASTE_GENERATED': 100,
    'GENDER_DIVERSITY': 0,
    'SAFETY_INCIDENTS': 0,
    'EMPLOYEE_WELLBEING': 0,
    'DATA_BREACHES': 0,
    'COMPLAINTS': 0,
}

CONFIDENCE_TABLE_TOTAL = 0.90
CONFIDENCE_TABLE_ONLY = 0.70
CONFIDENCE_PARAGRAPH_MAX = 0.50


# ============================================================================
# LAYER 0.5: ANNEXURE / SUMMARY TABLE SCANNER  (FIX 56)
# ============================================================================

class AnnexureSummaryScanner:
    """
    FIX 56: Detects and extracts from verified performance data summary tables
    that appear near the end of ESG/BRSR reports.

    These tables (Annexure 1, GRI Index, ESG Data Summary, KPI tables, etc.)
    are auditor-verified and contain the most authoritative values.
    Assigned source_type='annexure' with confidence=0.97 (highest priority).

    Strategy
    --------
    1. Scan page titles/headers for annexure keywords (last 60% of pages).
    2. On matching pages, extract ALL pdfplumber grid tables.
    3. Also scan page text line-by-line for "label | unit | value" patterns.
    4. Map row labels → ESG metrics using a comprehensive label map.
    5. Return extracted metrics with highest-priority source tag.
    """

    ANNEXURE_TITLE_RE = re.compile(
        r'(?:'
        r'annexure\s*\d*'
        r'|verified\s+performance\s+data'
        r'|key\s+performance\s+(?:data|indicator)'
        r'|esg\s+(?:data\s+)?(?:summary|appendix|index|scorecard)'
        r'|gri\s+(?:content\s+)?index'
        r'|sustainability\s+(?:data\s+)?(?:summary|appendix)'
        r'|environmental\s+(?:data|performance)\s+(?:summary|table)'
        r'|performance\s+data\s+(?:table|summary)'
        r'|brsr\s+(?:core\s+)?data\s+(?:summary|table)'
        r'|integrated\s+reporting\s+data'
        r'|(?:fy|financial\s+year)\s*20\d{2}[-–]\s*\d{2,4}\s+data'
        r')',
        re.I
    )

    LABEL_MAP: List[Tuple[re.Pattern, str]] = [
        # ── SCOPE 1 ──────────────────────────────────────────────────────────
        (re.compile(r'co2e?\s*[-–—]\s*scope\s*1\b', re.I),          'SCOPE_1'),
        (re.compile(r'scope\s*1\s+(?:ghg\s+)?emiss', re.I),         'SCOPE_1'),
        (re.compile(r'total\s+scope\s*1', re.I),                      'SCOPE_1'),
        (re.compile(r'direct\s+(?:ghg|greenhouse|co2)', re.I),        'SCOPE_1'),
        (re.compile(r'\bscope\s*[-–]?\s*1\b', re.I),                  'SCOPE_1'),
        # ── SCOPE 2 ──────────────────────────────────────────────────────────
        (re.compile(r'co2e?\s*[-–—]\s*scope\s*2\b', re.I),          'SCOPE_2'),
        (re.compile(r'scope\s*2\s+(?:ghg\s+)?emiss', re.I),         'SCOPE_2'),
        (re.compile(r'total\s+scope\s*2', re.I),                      'SCOPE_2'),
        (re.compile(r'indirect\s+(?:ghg|co2|emiss)', re.I),           'SCOPE_2'),
        (re.compile(r'\bscope\s*[-–]?\s*2\b', re.I),                  'SCOPE_2'),
        # ── SCOPE 3 ──────────────────────────────────────────────────────────
        (re.compile(r'co2e?\s*[-–—]\s*scope\s*3\b', re.I),          'SCOPE_3'),
        (re.compile(r'scope\s*3\s+(?:ghg\s+)?emiss', re.I),         'SCOPE_3'),
        (re.compile(r'total\s+scope\s*3', re.I),                      'SCOPE_3'),
        (re.compile(r'value\s+chain\s+emiss', re.I),                  'SCOPE_3'),
        (re.compile(r'\bscope\s*[-–]?\s*3\b', re.I),                  'SCOPE_3'),
        # ── ENERGY ───────────────────────────────────────────────────────────
        (re.compile(r'total\s+energy\s+consum(?:ed|ption)', re.I),   'ENERGY_CONSUMPTION'),
        (re.compile(r'total\s+energy\s*\(a\+b', re.I),               'ENERGY_CONSUMPTION'),
        (re.compile(r'direct\s+energy\s+consum', re.I),               'ENERGY_CONSUMPTION'),
        (re.compile(r'non.?renewable\s+energy', re.I),                 'ENERGY_CONSUMPTION'),
        (re.compile(r'(?:total\s+)?fuel\s+consumption', re.I),        'ENERGY_CONSUMPTION'),
        (re.compile(r'energy\s+consumption', re.I),                    'ENERGY_CONSUMPTION'),
        # ── WATER ────────────────────────────────────────────────────────────
        (re.compile(r'water\s+withdrawal\s*[-–—]\s*total', re.I),    'WATER_USAGE'),
        (re.compile(r'total\s+water\s+withdrawal', re.I),             'WATER_USAGE'),
        (re.compile(r'water\s+\(fresh\)\s+consum', re.I),             'WATER_USAGE'),
        (re.compile(r'total\s+water\s+consum', re.I),                 'WATER_USAGE'),
        (re.compile(r'freshwater\s+consum', re.I),                     'WATER_USAGE'),
        (re.compile(r'water\s+consum', re.I),                          'WATER_USAGE'),
        (re.compile(r'water\s+withdrawal', re.I),                      'WATER_USAGE'),
        # ── WASTE ────────────────────────────────────────────────────────────
        (re.compile(r'total\s+waste\s+gen', re.I),                    'WASTE_GENERATED'),
        (re.compile(r'hazardous\s+\+\s*non.?haz', re.I),              'WASTE_GENERATED'),
        (re.compile(r'non.?hazardous\s+waste\s*[-–—]\s*gen', re.I),  'WASTE_GENERATED'),
        (re.compile(r'hazardous\s+waste\s*[-–—]\s*gen', re.I),       'WASTE_GENERATED'),
        (re.compile(r'solid\s+waste\s+gen', re.I),                    'WASTE_GENERATED'),
        (re.compile(r'waste\s+gen(?:erated)?', re.I),                  'WASTE_GENERATED'),
        # ── GENDER DIVERSITY ─────────────────────────────────────────────────
        (re.compile(r'women\s+in\s+(?:total\s+)?workforce', re.I),   'GENDER_DIVERSITY'),
        (re.compile(r'female\s+(?:employee|workforce|representation)', re.I), 'GENDER_DIVERSITY'),
        (re.compile(r'gender\s+(?:diversity|ratio)', re.I),           'GENDER_DIVERSITY'),
        (re.compile(r'women\s+(?:employee|staff|worker)', re.I),      'GENDER_DIVERSITY'),
        (re.compile(r'(?:percentage|%)\s+(?:of\s+)?women', re.I),    'GENDER_DIVERSITY'),
        # ── SAFETY INCIDENTS ─────────────────────────────────────────────────
        (re.compile(r'total\s+recordable\s+injur', re.I),             'SAFETY_INCIDENTS'),
        (re.compile(r'lost\s+time\s+injur', re.I),                    'SAFETY_INCIDENTS'),
        (re.compile(r'\bltifr\b', re.I),                               'SAFETY_INCIDENTS'),
        (re.compile(r'fatal(?:it(?:y|ies))?', re.I),                  'SAFETY_INCIDENTS'),
        (re.compile(r'safety\s+incident', re.I),                       'SAFETY_INCIDENTS'),
        (re.compile(r'work.?related\s+injur', re.I),                  'SAFETY_INCIDENTS'),
        (re.compile(r'occupational\s+injur', re.I),                    'SAFETY_INCIDENTS'),
        # ── EMPLOYEE WELLBEING ───────────────────────────────────────────────
        (re.compile(r'employee\s+(?:turnover|attrition)\s+rate', re.I), 'EMPLOYEE_WELLBEING'),
        (re.compile(r'attrition\s+rate', re.I),                        'EMPLOYEE_WELLBEING'),
        (re.compile(r'training\s+hours?\s+per\s+employee', re.I),     'EMPLOYEE_WELLBEING'),
        (re.compile(r'average\s+training\s+hours?', re.I),             'EMPLOYEE_WELLBEING'),
        (re.compile(r'employee\s+satisfaction', re.I),                  'EMPLOYEE_WELLBEING'),
        # ── DATA BREACHES ────────────────────────────────────────────────────
        (re.compile(r'data\s+breach(?:es)?', re.I),                   'DATA_BREACHES'),
        (re.compile(r'cyber\s*(?:security)?\s*incident', re.I),       'DATA_BREACHES'),
        (re.compile(r'information\s+security\s+incident', re.I),       'DATA_BREACHES'),
        (re.compile(r'privacy\s+breach', re.I),                        'DATA_BREACHES'),
        # ── COMPLAINTS ───────────────────────────────────────────────────────
        (re.compile(r'customer\s+complaint', re.I),                    'COMPLAINTS'),
        (re.compile(r'consumer\s+complaint', re.I),                    'COMPLAINTS'),
        (re.compile(r'total\s+complaint', re.I),                       'COMPLAINTS'),
        (re.compile(r'grievance\s+(?:received|filed)', re.I),          'COMPLAINTS'),
    ]

    _NIL_RE = re.compile(
        r'\b(nil|zero|none|no\s+(?:breach|incident)|not\s+applicable)\b', re.I
    )

    _REJECT_RE = re.compile(
        r'\bper\s+(?:employee|fte|unit|tonne|rupee|revenue|kwh|mwh)\b'
        r'|\bintensity\b|\btarget\b|\bforecast\b|\bprojection\b',
        re.I
    )

    _UNIT_HINT_RE = re.compile(
        r'\b(GJ|MJ|TJ|PJ|MWh|GWh|kWh|KL|kl|ML|GL|m3|m³|'
        r'tCO2e?|TCO2e?|MT|kg|t\b|T\b|%)\b',
        re.I
    )

    @classmethod
    def extract(cls, pdf_data: Dict) -> List[Dict]:
        """Main entry point. Returns list of metric dicts from annexure tables."""
        pages = pdf_data.get('pages', [])
        tables = pdf_data.get('tables', [])
        total_pages = len(pages)

        if total_pages == 0:
            return []

        start_page = max(1, int(total_pages * 0.40))
        annexure_pages: Set[int] = set()

        for page_info in pages:
            pnum = page_info['page_number']
            if pnum < start_page:
                continue
            text = page_info.get('text', '')
            if cls.ANNEXURE_TITLE_RE.search(text[:400]):
                for offset in range(16):
                    annexure_pages.add(pnum + offset)
                print(f"    [AnnexureScanner] Annexure/summary detected starting page {pnum}")

        if not annexure_pages:
            broad_start = max(1, int(total_pages * 0.80))
            for page_info in pages:
                pnum = page_info['page_number']
                if pnum < broad_start:
                    continue
                text = page_info.get('text', '')
                label_hits = sum(
                    1 for pat, m_name in cls.LABEL_MAP
                    for m in [pat.search(text)] if m
                )
                if label_hits >= 3:
                    for offset in range(10):
                        annexure_pages.add(pnum + offset)
                    print(f"    [AnnexureScanner] Heuristic summary zone at page {pnum} "
                          f"({label_hits} label hits)")
                    break

        if not annexure_pages:
            print(f"    [AnnexureScanner] No annexure/summary table found in document")
            return []

        print(f"    [AnnexureScanner] Annexure zone pages: "
              f"{sorted(annexure_pages)[:10]}{'...' if len(annexure_pages) > 10 else ''}")

        metrics: Dict[str, Dict] = {}

        for table_info in tables:
            if table_info['page'] not in annexure_pages:
                continue
            extracted = cls._extract_from_grid_table(
                table_info['table'], table_info['page']
            )
            for m in extracted:
                name = m['normalized_metric']
                if name not in metrics or m['confidence'] > metrics[name]['confidence']:
                    metrics[name] = m

        for page_info in pages:
            if page_info['page_number'] not in annexure_pages:
                continue
            extracted = cls._extract_from_text_lines(
                page_info['text'], page_info['page_number']
            )
            for m in extracted:
                name = m['normalized_metric']
                if name not in metrics or m['confidence'] > metrics[name]['confidence']:
                    metrics[name] = m

        result_list = list(metrics.values())
        print(f"    [AnnexureScanner] Extracted {len(result_list)} metric(s) from annexure")
        for m in result_list:
            print(f"      [ANN] {m['normalized_metric']}: {m['value']} {m['unit']} "
                  f"(page {m['page']})")

        return result_list

    @classmethod
    def _extract_from_grid_table(cls, table: List[List[str]], page_num: int) -> List[Dict]:
        results = []
        if not table or len(table) < 2:
            return results

        unit_col = cls._detect_unit_column(table)

        for row in table:
            if not row or not row[0]:
                continue
            label = str(row[0]).strip()
            if not label or len(label) < 3:
                continue

            metric_name = cls._map_label(label)
            if not metric_name:
                continue

            if cls._REJECT_RE.search(label):
                continue

            unit_str = ''
            if unit_col >= 0 and unit_col < len(row) and row[unit_col]:
                unit_str = str(row[unit_col]).strip()

            value, detected_unit = cls._extract_value_from_row(row, label_col=0, unit_col=unit_col)
            if value is None:
                row_text = ' '.join(str(c) for c in row if c)
                if metric_name == 'DATA_BREACHES' and cls._NIL_RE.search(row_text):
                    results.append(cls._make_metric(metric_name, 0, '', label, page_num, nil=True))
                continue

            final_unit = unit_str or detected_unit
            final_unit = cls._normalize_unit_str(final_unit, metric_name)

            results.append(cls._make_metric(metric_name, value, final_unit, label, page_num))

        return results

    @classmethod
    def _extract_from_text_lines(cls, page_text: str, page_num: int) -> List[Dict]:
        results = []
        lines = page_text.splitlines()

        for line in lines:
            line = line.strip()
            if not line or len(line) < 5:
                continue

            if cls._REJECT_RE.search(line):
                continue

            metric_name = cls._map_label(line)
            if not metric_name:
                continue

            if metric_name == 'DATA_BREACHES' and cls._NIL_RE.search(line):
                results.append(cls._make_metric(metric_name, 0, '', line[:80], page_num, nil=True))
                continue

            unit_match = cls._UNIT_HINT_RE.search(line)
            unit_str = unit_match.group(1) if unit_match else ''

            numbers = re.findall(r'[\d,]+\.?\d*', line)
            valid_nums = []
            for n in numbers:
                try:
                    v = float(n.replace(',', ''))
                    if v < 1 or 1900 <= v <= 2100 or v in {1, 2, 3, 4, 5, 10}:
                        continue
                    valid_nums.append(v)
                except ValueError:
                    continue

            if not valid_nums:
                continue

            value = valid_nums[0]
            final_unit = cls._normalize_unit_str(unit_str, metric_name)
            results.append(cls._make_metric(metric_name, value, final_unit, line[:80], page_num))

        return results

    @classmethod
    def _map_label(cls, label: str) -> Optional[str]:
        label_clean = label.strip()
        for pattern, metric_name in cls.LABEL_MAP:
            if pattern.search(label_clean):
                return metric_name
        return None

    @classmethod
    def _detect_unit_column(cls, table: List[List[str]]) -> int:
        for col_idx in [1, 2]:
            unit_hits = 0
            total = 0
            for row in table[1:]:
                if col_idx >= len(row) or not row[col_idx]:
                    continue
                cell = str(row[col_idx]).strip()
                if not cell:
                    continue
                total += 1
                if cls._UNIT_HINT_RE.search(cell) and len(cell) <= 15:
                    unit_hits += 1
            if total > 0 and unit_hits / total >= 0.5:
                return col_idx
        return -1

    @classmethod
    def _extract_value_from_row(cls, row: List[str], label_col: int,
                                 unit_col: int) -> Tuple[Optional[float], str]:
        skip_cols = {label_col}
        if unit_col >= 0:
            skip_cols.add(unit_col)

        detected_unit = ''
        for col_idx, cell in enumerate(row):
            if col_idx in skip_cols or not cell:
                continue
            cell_str = str(cell).strip()
            if not cell_str:
                continue

            um = cls._UNIT_HINT_RE.search(cell_str)
            if um and not detected_unit:
                detected_unit = um.group(1)

            nums = re.findall(r'[\d,]+\.?\d*', cell_str)
            for n in nums:
                try:
                    v = float(n.replace(',', ''))
                    if v < 1 or 1900 <= v <= 2100:
                        continue
                    if v in {1, 2, 3, 4, 5, 10}:
                        continue
                    return v, detected_unit
                except ValueError:
                    continue

        return None, detected_unit

    @classmethod
    def _normalize_unit_str(cls, unit_str: str, metric_name: str) -> str:
        if not unit_str:
            defaults = {
                'SCOPE_1': 'tCO2e', 'SCOPE_2': 'tCO2e', 'SCOPE_3': 'tCO2e',
                'ENERGY_CONSUMPTION': 'GJ',
                'WATER_USAGE': 'KL',
                'WASTE_GENERATED': 'MT',
                'GENDER_DIVERSITY': '%',
            }
            return defaults.get(metric_name, '')

        unit_lower = unit_str.lower().strip()

        if unit_lower in ('t', 'tonnes', 'metric tonnes', 'mt co2e'):
            return 'tCO2e'
        if unit_lower in ('tco2e', 'tco2'):
            return 'tCO2e'
        if unit_lower == 'kt':
            return 'ktCO2e'
        if unit_lower == 'gj':
            return 'GJ'
        if unit_lower == 'mj':
            return 'MJ'
        if unit_lower in ('mwh', 'gwh', 'kwh'):
            return unit_str.upper()
        if unit_lower in ('kl', 'kilolitre', 'kiloliter', 'kilolitres', 'kiloliters'):
            return 'KL'
        if unit_lower in ('ml',):
            return 'ML'
        if unit_lower in ('m3', 'm³'):
            return 'KL'
        if unit_lower == 'mt':
            return 'MT'
        if unit_lower == 'kg':
            return 'kg'
        if unit_lower == '%':
            return '%'

        return UNIT_NORMALIZATION.get(unit_lower, unit_str)

    @classmethod
    def _make_metric(cls, metric_name: str, value: float, unit: str,
                     label: str, page_num: int, nil: bool = False) -> Dict:
        confidence = 0.97 if not nil else 0.95
        return {
            'normalized_metric':  metric_name,
            'value':              value,
            'unit':               unit,
            'entity_text':        label[:100],
            'context':            label[:200],
            'section_type':       'Environmental',
            'confidence':         confidence,
            'validation_status':  'VALID',
            'validation_issues':  ['annexure_nil'] if nil else [],
            'source_type':        'annexure',
            'page':               page_num,
        }


# ============================================================================
# LAYER 1: PDF EXTRACTION
# ============================================================================

class PDFExtractor:
    """Extract text and tables from PDF using pdfplumber"""

    def __init__(self):
        if not PDF_AVAILABLE:
            raise ImportError("pdfplumber is required. Install with: pip install pdfplumber")

    def extract_text_and_tables(self, pdf_path: str) -> Dict:
        result = {'full_text': '', 'pages': [], 'tables': []}
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text()
                if text:
                    result['pages'].append({'page_number': page_num, 'text': text})
                    result['full_text'] += text + '\n\n'
                tables = page.extract_tables()
                if tables:
                    for table_idx, table in enumerate(tables):
                        cleaned_table = []
                        for row in table:
                            cleaned_row = [
                                cell.strip() if cell and isinstance(cell, str) else (cell if cell else '')
                                for cell in row
                            ]
                            if any(cell for cell in cleaned_row):
                                cleaned_table.append(cleaned_row)
                        if len(cleaned_table) > 1:
                            result['tables'].append({
                                'page': page_num,
                                'table': cleaned_table,
                                'table_index': table_idx
                            })
        return result


# ============================================================================
# LAYER 1a: TABLE RECONSTRUCTOR
# ============================================================================

class TableReconstructor:
    """
    FIX 47: Structured table reconstruction pipeline.
    Integrates all v10.0 bug fixes (FIX 50-55) plus v9.0 improvements.
    """

    SCOPE_PATTERNS = {
        'SCOPE_1': [
            re.compile(r'total\s+scope\s*1', re.I),
            re.compile(r'scope\s*1\s+emission', re.I),
            re.compile(r'scope\s*-?\s*1', re.I),
            re.compile(r'direct\s+emission', re.I),
        ],
        'SCOPE_2': [
            re.compile(r'total\s+scope\s*2', re.I),
            re.compile(r'scope\s*2\s+emission', re.I),
            re.compile(r'scope\s*-?\s*2', re.I),
            re.compile(r'indirect\s+emission', re.I),
        ],
        'SCOPE_3': [
            re.compile(r'total\s+scope\s*3', re.I),
            re.compile(r'scope\s*3\s+emission', re.I),
            re.compile(r'scope\s*-?\s*3', re.I),
            re.compile(r'other\s+indirect\s+emission', re.I),
            re.compile(r'value\s+chain\s+emission', re.I),
        ],
    }

    # FIX 50: Grand-total formula patterns listed FIRST so they always win
    ENERGY_PATTERNS = [
        re.compile(r'total\s+energy\s+consumed?\s*\(a\+b\+c\+d\+e\+f\)', re.I),
        re.compile(r'total\s+energy\s+\(a\+b\+c\+d\+e\+f\)', re.I),
        re.compile(r'total\s+energy\s+consumed?\s*\(a\s*\+\s*b\s*\+\s*c\s*\+\s*d\s*\+\s*e\s*\+\s*f\)', re.I),
        re.compile(r'total\s+energy\s+consum(?:ed|ption)', re.I),
        re.compile(r'total\s+electricity\s+consum(?:ed|ption)', re.I),
        re.compile(r'total\s+energy\s+\(a\+b\+c\)', re.I),
    ]

    # FIX 50: sub-row pattern for single-letter component rows like "(A)", "(B)"
    _ENERGY_SUB_ROW_RE = re.compile(r'\(\s*[A-Fa-f]\s*\)\s*$')

    # FIX 51: waste grand-total formula
    _WASTE_FORMULA_RE = re.compile(
        r'total\s*\(\s*a\s*\+\s*b\s*\+?\s*c?\s*\+?\s*d?\s*\+?\s*e?\s*\+?\s*f?\s*\+?\s*g?\s*\+?\s*h?\s*\)',
        re.I
    )

    WASTE_PATTERNS = [
        re.compile(r'total\s+waste', re.I),
        re.compile(r'waste\s+generated', re.I),
        re.compile(r'hazardous\s+waste', re.I),
        re.compile(r'non.?hazardous\s+waste', re.I),
        re.compile(r'other\s+waste', re.I),
        re.compile(r'plastic\s+waste', re.I),
        re.compile(r'e.?waste', re.I),
        re.compile(r'bio.?medical\s+waste', re.I),
        re.compile(r'construction.*waste', re.I),
        re.compile(r'battery\s+waste', re.I),
    ]

    WATER_PATTERNS = [
        re.compile(r'total\s+water', re.I),
        re.compile(r'water\s+withdrawal', re.I),
        re.compile(r'water\s+consumption', re.I),
        re.compile(r'groundwater', re.I),
        re.compile(r'ground\s+water', re.I),
        re.compile(r'surface\s+water', re.I),
        re.compile(r'third.?party\s+water', re.I),
        re.compile(r'municipal\s+water', re.I),
        re.compile(r'tanker\s+water', re.I),
        re.compile(r'rainwater', re.I),
    ]

    GENDER_DIVERSITY_PATTERNS = [
        re.compile(r'women\s+(?:in\s+)?(?:workforce|employees|total)', re.I),
        re.compile(r'female\s+(?:employees|representation|workforce|workers)', re.I),
        re.compile(r'gender\s+diversity', re.I),
        re.compile(r'(?:percentage|%|proportion)\s+(?:of\s+)?(?:women|female)', re.I),
        re.compile(r'workforce\s+diversity', re.I),
        re.compile(r'women\s+employees', re.I),
    ]

    SAFETY_INCIDENTS_PATTERNS = [
        re.compile(r'(?:total|number\s+of)\s+(?:safety\s+)?incidents?', re.I),
        re.compile(r'(?:total|number\s+of)\s+(?:recordable\s+)?injur(?:y|ies)', re.I),
        re.compile(r'lost\s+time\s+injur(?:y|ies)', re.I),
        re.compile(r'\bltifr\b', re.I),
        re.compile(r'fatalit(?:y|ies)', re.I),
        re.compile(r'occupational\s+(?:health.*)?incident', re.I),
        re.compile(r'workplace\s+accident', re.I),
        re.compile(r'reportable\s+incident', re.I),
    ]

    EMPLOYEE_WELLBEING_PATTERNS = [
        re.compile(r'(?:total|average)\s+training\s+hours', re.I),
        re.compile(r'employee\s+(?:turnover|attrition)\s+(?:rate)?', re.I),
        re.compile(r'employee\s+well.?being', re.I),
        re.compile(r'employee\s+satisfaction', re.I),
        re.compile(r'training\s+hours\s+per\s+employee', re.I),
        re.compile(r'attrition\s+rate', re.I),
    ]

    # FIX 53: context patterns used in page-level nil scan
    DATA_BREACHES_CONTEXT_RE = re.compile(
        r'data\s+breach|cyber\s*(?:security)?\s*incident|'
        r'(?:information|data)\s+security\s+incident|'
        r'privacy\s+breach|instances?\s+of\s+data\s+breach|'
        r'no\s+(?:data\s+)?breach|zero\s+breach',
        re.I
    )

    DATA_BREACHES_PATTERNS = [
        re.compile(r'(?:number\s+of\s+)?data\s+breach', re.I),
        re.compile(r'cyber\s*(?:security)?\s*incident', re.I),
        re.compile(r'(?:number\s+of\s+)?(?:information|data)\s+security\s+incident', re.I),
        re.compile(r'privacy\s+breach', re.I),
        re.compile(r'no\s+(?:data\s+)?breach', re.I),
        re.compile(r'(?:zero|nil|0)\s+(?:data\s+)?breach', re.I),
    ]

    COMPLAINTS_PATTERNS = [
        re.compile(r'customer[s]?\s+(?:complaints?|grievances?)', re.I),
        re.compile(r'consumer\s+complaints?', re.I),
        re.compile(r'(?:total|number\s+of)\s+complaints?\s+(?:received|filed|reported)?', re.I),
        re.compile(r'(?:total|number\s+of)\s+grievance', re.I),
        re.compile(r'whistleblower\s+complaints?', re.I),
        re.compile(r'stakeholder\s+complaints?', re.I),
        re.compile(r'complaints?\s+(?:under|related\s+to)', re.I),
    ]

    REJECT_PATTERNS = [
        re.compile(r'\bper\s+(employee|fte|unit|tonne|kwh|mwh|revenue|capita)', re.I),
        re.compile(r'\bintensity\b', re.I),
        re.compile(r'\b(?:emission|carbon|ghg|reduction)\s+target\b', re.I),
        re.compile(r'\b20\d{2}\s+target\b', re.I),
        re.compile(r'\btarget(?:ed|ing)\b', re.I),
        re.compile(r'\bprojection\b', re.I),
        re.compile(r'\bforecast\b', re.I),
        re.compile(r'^baseline\s*$', re.I),
        re.compile(r'^goal\s*$', re.I),
    ]

    # FIX 53/54/55 cross-contamination guards
    _NIL_RE = re.compile(
        r'\b(nil|zero|no\s+(?:data\s+)?breach(?:es)?|no\s+such\s+instances?'
        r'|not\s+reported|0\s+breach(?:es)?|no\s+instances?|none\s+reported)\b',
        re.I
    )

    # FIX 55: cross-contamination guard patterns for SAFETY_INCIDENTS
    _DATA_BREACH_CROSS_RE = re.compile(
        r'data\s+breach|cyber\s*incident|privacy\s+breach', re.I
    )
    _COMPLAINT_CROSS_RE = re.compile(
        r'complaint|grievance|whistleblower', re.I
    )

    _current_year_col: int = 0

    @classmethod
    def extract_from_pdf(cls, pdf_data: Dict) -> List[Dict]:
        """Main entry: extract ESG metrics from PDF data using table reconstruction."""
        all_rows = []

        for table_info in pdf_data.get('tables', []):
            raw_table = table_info['table']
            page_num = table_info['page']
            normalized = cls._normalize_table(raw_table)
            for row_str in normalized:
                all_rows.append({'text': row_str, 'page': page_num})

        for page_info in pdf_data.get('pages', []):
            text_rows = cls._extract_text_table_rows(page_info['text'])
            for row_str in text_rows:
                all_rows.append({'text': row_str, 'page': page_info['page_number']})

        print(f"    [TableReconstructor] {len(all_rows)} normalized rows collected")

        # FIX 57: Robust multi-signal year-column detection (replaces single-pass scan)
        cls._current_year_col = 0   # default: first number = current year
        cls._detect_year_column_robust(all_rows, pdf_data)

        metrics = {}

        for scope_metric, patterns in cls.SCOPE_PATTERNS.items():
            result = cls._extract_scope(all_rows, patterns, scope_metric)
            if result:
                metrics[scope_metric] = result
                print(f"      [TR] {scope_metric}: {result['value']} {result['unit']} "
                      f"(page {result['page']})")

        if 'SCOPE_1' not in metrics:
            scope1_fallback = cls._extract_scope1_from_components(pdf_data)
            if scope1_fallback:
                metrics['SCOPE_1'] = scope1_fallback
                print(f"      [TR] SCOPE_1 (component sum): {scope1_fallback['value']} "
                      f"{scope1_fallback['unit']} (page {scope1_fallback['page']})")

        # FIX 50: two-pass energy extraction
        energy = cls._extract_energy(all_rows)
        if energy:
            metrics['ENERGY_CONSUMPTION'] = energy
            print(f"      [TR] ENERGY_CONSUMPTION: {energy['value']} {energy['unit']} "
                  f"(page {energy['page']})")

        # FIX 51: three-pass waste extraction
        waste = cls._extract_waste(all_rows)
        if waste:
            metrics['WASTE_GENERATED'] = waste
            print(f"      [TR] WASTE_GENERATED: {waste['value']} {waste['unit']} "
                  f"(page {waste['page']})")

        water = cls._extract_water(all_rows)
        if water:
            metrics['WATER_USAGE'] = water
            print(f"      [TR] WATER_USAGE: {water['value']} {water['unit']} "
                  f"(page {water['page']})")

        gender = cls._extract_gender_diversity(all_rows)
        if gender:
            metrics['GENDER_DIVERSITY'] = gender
            print(f"      [TR] GENDER_DIVERSITY: {gender['value']} {gender['unit']} "
                  f"(page {gender['page']})")

        # FIX 55: safety extraction with cross-contamination guard
        safety = cls._extract_safety_incidents(all_rows)
        if safety:
            metrics['SAFETY_INCIDENTS'] = safety
            print(f"      [TR] SAFETY_INCIDENTS: {safety['value']} {safety['unit']} "
                  f"(page {safety['page']})")

        wellbeing = cls._extract_employee_wellbeing(all_rows)
        if wellbeing:
            metrics['EMPLOYEE_WELLBEING'] = wellbeing
            print(f"      [TR] EMPLOYEE_WELLBEING: {wellbeing['value']} {wellbeing['unit']} "
                  f"(page {wellbeing['page']})")

        # FIX 53: data breaches — page-level nil scan first, then row-level
        breaches = cls._extract_data_breaches(all_rows, pdf_data)
        if breaches:
            metrics['DATA_BREACHES'] = breaches
            print(f"      [TR] DATA_BREACHES: {breaches['value']} {breaches['unit']} "
                  f"(page {breaches['page']})")

        # FIX 54: complaints — extended reject + min 1,000 for customer rows
        complaints = cls._extract_complaints(all_rows)
        if complaints:
            metrics['COMPLAINTS'] = complaints
            print(f"      [TR] COMPLAINTS: {complaints['value']} {complaints['unit']} "
                  f"(page {complaints['page']})")

        return list(metrics.values())

    # ------------------------------------------------------------------
    # ROW NORMALIZATION
    # ------------------------------------------------------------------

    @classmethod
    def _normalize_table(cls, table: List[List[str]]) -> List[str]:
        raw_strings = []
        for row in table:
            if not row:
                continue
            row_text = " ".join([str(cell).strip() for cell in row if cell and str(cell).strip()])
            if row_text:
                raw_strings.append(row_text)

        normalized = []
        buffer = ""
        for row_text in raw_strings:
            if buffer:
                row_text = buffer + " " + row_text
                buffer = ""
            words = row_text.split()
            has_number = bool(re.search(r'\d', row_text))
            if len(words) < 3 and not has_number:
                buffer = row_text
            else:
                normalized.append(row_text)
        if buffer:
            if normalized:
                normalized[-1] = normalized[-1] + " " + buffer
            else:
                normalized.append(buffer)
        return normalized

    @classmethod
    def _extract_text_table_rows(cls, page_text: str) -> List[str]:
        rows = []
        for line in page_text.splitlines():
            line = line.strip()
            if not line:
                continue
            if re.search(r'[\d,]+\.?\d*', line):
                rows.append(line)
        return rows

    # ------------------------------------------------------------------
    # METRIC EXTRACTION HELPERS
    # ------------------------------------------------------------------

    @classmethod
    def _is_rejected(cls, text: str) -> bool:
        for pat in cls.REJECT_PATTERNS:
            if pat.search(text):
                return True
        return False

    @classmethod
    def _score_row(cls, text: str) -> int:
        text_lower = text.lower()
        score = 1
        if 'total' in text_lower:
            score += 5
        if 'overall' in text_lower:
            score += 4
        if 'consumption' in text_lower:
            score += 3
        if 'gross' in text_lower:
            score += 2
        return score

    # ------------------------------------------------------------------
    # FIX 57: ROBUST YEAR-COLUMN DETECTION
    # ------------------------------------------------------------------

    # Matches year expressions: "2024-25", "FY2024", "FY 24", "2024", "FY2023-24"
    _YEAR_EXPR_RE = re.compile(
        r'\b(?:FY\s*)?'
        r'(20\d{2})(?:\s*[-–]\s*(?:20)?(\d{2}))?\b'
        r'|'
        r'\bFY\s*(\d{2})(?:\s*[-–]\s*(\d{2}))?\b',
        re.I
    )

    @classmethod
    def _parse_year_expr(cls, text: str) -> Optional[int]:
        """
        Extract the fiscal year end as a 4-digit integer from a year expression.
        Examples:
          "2024-25"   → 2025
          "FY2023-24" → 2024
          "FY 24"     → 2024
          "2023"      → 2023
        Returns None if no year found.
        """
        m = cls._YEAR_EXPR_RE.search(text)
        if not m:
            return None
        # Group 1+2: "2024-25" style
        if m.group(1):
            base = int(m.group(1))
            if m.group(2):
                # trailing two digits → full year
                suffix = int(m.group(2))
                return base + 1 if suffix == (base % 100) + 1 else base
            return base
        # Group 3+4: "FY24-25" style
        if m.group(3):
            y = int(m.group(3))
            base = 2000 + y if y < 50 else 1900 + y
            if m.group(4):
                suffix = int(m.group(4))
                next_y = (y + 1) % 100
                return base + 1 if suffix == next_y else base
            return base
        return None

    @classmethod
    def _detect_year_column_robust(cls, all_rows: List[Dict],
                                   pdf_data: Optional[Dict] = None) -> None:
        """
        FIX 57: Multi-signal year-column detector.

        Strategy (signals tried in order, first confident signal wins):

        Signal A — Explicit year headers in row text (e.g. "FY 2024-25  FY 2023-24")
                   Scan ALL rows (not just first 30) to handle late-appearing tables.
                   If the leftmost year > rightmost year → col 0 = current year.
                   If leftmost year < rightmost year → last col = current year.

        Signal B — Fiscal year phrase in page text
                   Patterns like "for the year ended March 31, 2025" or
                   "FY 2024-25" appearing in prose → extract the current FY year.
                   Then look for matching year in any header row to detect column pos.

        Signal C — Title/header keyword heuristics
                   "Current Year" / "Previous Year" label pairs in the header row.
                   "FY … FY …" label ordering from column headers.

        Signal D — Default (unchanged)
                   col 0 = current year (true for the large majority of Indian ESG
                   reports where the most recent year is printed on the left).

        The resolved column order is stored in cls._current_year_col:
            0  → pick FIRST valid number  (current year is in left column)
           -1  → pick LAST valid number   (current year is in right column)
        """
        import datetime
        current_calendar_year = datetime.datetime.now().year  # e.g. 2025

        # ── Signal A: scan header rows across ALL collected rows ──────────────
        for row_info in all_rows:
            row_text = row_info['text']

            # Only consider rows that look like headers (contain year-like tokens,
            # few or no large numbers)
            raw_years = cls._YEAR_EXPR_RE.findall(row_text)
            if len(raw_years) < 2:
                continue

            # Parse all year expressions found in order of appearance
            year_values = []
            for match in cls._YEAR_EXPR_RE.finditer(row_text):
                y = cls._parse_year_expr(match.group(0))
                if y and 2000 <= y <= current_calendar_year + 2:
                    year_values.append(y)

            if len(year_values) < 2:
                continue

            # Deduplicate consecutive duplicates but preserve order
            seen_y = []
            for yv in year_values:
                if not seen_y or yv != seen_y[-1]:
                    seen_y.append(yv)
            if len(seen_y) < 2:
                continue

            first_y, last_y = seen_y[0], seen_y[-1]

            if first_y == last_y:
                continue  # ambiguous — can't tell column order

            if first_y > last_y:
                # "FY 2025-26  FY 2024-25" → most recent on LEFT
                cls._current_year_col = 0
            else:
                # "FY 2023-24  FY 2024-25" → most recent on RIGHT
                cls._current_year_col = -1

            print(f"    [TR-FIX57-A] Year header detected: {seen_y} → "
                  f"{'FIRST' if cls._current_year_col == 0 else 'LAST'}=current year "
                  f"(row: {row_text[:60]})")
            return   # Signal A resolved — done

        # ── Signal B: fiscal-year phrase in page prose ────────────────────────
        if pdf_data:
            # Look for "year ended / ending March/December YYYY" or "FY YYYY-YY"
            fy_prose_re = re.compile(
                r'(?:year\s+end(?:ed|ing)[^\d]{0,30}(20\d{2}))'
                r'|(?:\bfor\s+(?:the\s+)?(?:financial|fiscal)\s+year[^\d]{0,20}(20\d{2}))'
                r'|(?:\bfy\s*(?:20)?(\d{2})[-–](?:20)?(\d{2}))',
                re.I
            )
            fy_years_found: List[int] = []
            for page_info in pdf_data.get('pages', [])[:15]:  # scan first 15 pages
                text = page_info.get('text', '')
                for m in fy_prose_re.finditer(text):
                    for g in m.groups():
                        if g:
                            y = int(g)
                            if y < 100:
                                y = 2000 + y
                            if 2000 <= y <= current_calendar_year + 2:
                                fy_years_found.append(y)

            if fy_years_found:
                # Use the MAXIMUM year found as the current reporting year
                current_fy = max(fy_years_found)
                print(f"    [TR-FIX57-B] Current FY detected from prose: {current_fy}")

                # Now find a header row containing this year and check position
                for row_info in all_rows:
                    row_text = row_info['text']
                    year_positions = []
                    for m in cls._YEAR_EXPR_RE.finditer(row_text):
                        y = cls._parse_year_expr(m.group(0))
                        if y and 2000 <= y <= current_calendar_year + 2:
                            year_positions.append((m.start(), y))

                    if len(year_positions) < 2:
                        continue

                    # Find which positional slot the current_fy occupies
                    positions_sorted = sorted(year_positions, key=lambda x: x[0])
                    years_in_order = [p[1] for p in positions_sorted]

                    if current_fy not in years_in_order:
                        continue

                    idx = years_in_order.index(current_fy)
                    if idx == 0:
                        cls._current_year_col = 0
                    else:
                        cls._current_year_col = -1

                    print(f"    [TR-FIX57-B] Column order confirmed from header match: "
                          f"years={years_in_order}, current_fy={current_fy} at pos {idx} → "
                          f"{'FIRST' if cls._current_year_col == 0 else 'LAST'}=current year")
                    return   # Signal B resolved — done

        # ── Signal C: "Current Year" / "Previous Year" label pairs ───────────
        current_year_re = re.compile(r'\bcurrent\s+year\b', re.I)
        previous_year_re = re.compile(r'\bprevious\s+year\b|\bprior\s+year\b|\blast\s+year\b', re.I)

        for row_info in all_rows:
            row_text = row_info['text']
            cm = current_year_re.search(row_text)
            pm = previous_year_re.search(row_text)
            if cm and pm:
                if cm.start() < pm.start():
                    cls._current_year_col = 0   # "Current Year … Previous Year"
                    print(f"    [TR-FIX57-C] 'Current/Previous Year' labels → FIRST=current year")
                else:
                    cls._current_year_col = -1  # "Previous Year … Current Year"
                    print(f"    [TR-FIX57-C] 'Previous/Current Year' labels → LAST=current year")
                return   # Signal C resolved — done

        # ── Signal D: default ─────────────────────────────────────────────────
        cls._current_year_col = 0
        print(f"    [TR-FIX57-D] No year signal found — defaulting to FIRST=current year")

    @classmethod
    def _set_year_column_order(cls, header_row_text: str) -> None:
        """Legacy helper kept for compatibility. Prefer _detect_year_column_robust."""
        years = re.findall(r'\b(20\d{2})\b', header_row_text)
        if len(years) >= 2:
            year_ints = [int(y) for y in years]
            if year_ints[0] >= year_ints[-1]:
                cls._current_year_col = 0
            else:
                cls._current_year_col = -1
            print(f"    [TR] Year order detected from header: {year_ints} → "
                  f"{'FIRST' if cls._current_year_col == 0 else 'LAST'}=current year")

    @classmethod
    def _extract_first_valid_number(cls, text: str, min_value: float = 1.0) -> Optional[float]:
        """
        FIX 57: Return the correct year's value from a row string.

        Uses cls._current_year_col set by _detect_year_column_robust:
            0  → return FIRST valid number  (current year is left column)
           -1  → return LAST valid number   (current year is right column)

        Filters out:
          - values below min_value
          - year-like integers (1900–2100)
          - common noise values {1,2,3,4,5,10}
          - percentage values when a large absolute value exists (avoids picking
            a stray "%" denominator instead of the actual metric value)
        """
        numbers = re.findall(r'[\d,]+\.?\d*', text)
        valid_numbers = []
        for num_str in numbers:
            try:
                value = float(num_str.replace(",", ""))
            except ValueError:
                continue
            if value < min_value:
                continue
            if 1900 <= value <= 2100:
                continue
            if value in {1, 2, 3, 4, 5, 10}:
                continue
            valid_numbers.append(value)

        if not valid_numbers:
            return None

        # If there are exactly two valid numbers and they look like a
        # "current year / previous year" pair, honour the column order flag.
        if cls._current_year_col == 0:
            return valid_numbers[0]   # current year is in the FIRST (left) column
        return valid_numbers[-1]      # current year is in the LAST (right) column

    @classmethod
    def _extract_scope(cls, rows: List[Dict], patterns: List[re.Pattern],
                       metric_name: str) -> Optional[Dict]:
        candidates = []
        for pattern in patterns:
            for row_info in rows:
                row_text = row_info['text']
                if cls._is_rejected(row_text):
                    continue
                if pattern.search(row_text):
                    value = cls._extract_first_valid_number(row_text, min_value=100)
                    if value is not None and value >= 1000:
                        score = cls._score_row(row_text)
                        candidates.append({
                            'row_text': row_text,
                            'value': value,
                            'page': row_info['page'],
                            'score': score,
                        })
        if candidates:
            best = max(candidates, key=lambda c: c['score'])
            unit = cls._detect_emission_unit(best['row_text'])
            print(f"[DEBUG] Selected row: {best['row_text'][:80]}   value: {best['value']}")
            return {
                'normalized_metric': metric_name,
                'value': best['value'],
                'unit': unit,
                'entity_text': best['row_text'][:100],
                'context': best['row_text'][:200],
                'section_type': 'Environmental',
                'confidence': CONFIDENCE_TABLE_TOTAL if 'total' in best['row_text'].lower() else CONFIDENCE_TABLE_ONLY,
                'validation_status': 'VALID',
                'validation_issues': [],
                'source_type': 'table_reconstructed',
                'page': best['page'],
            }
        return None

    @classmethod
    def _extract_scope1_from_components(cls, pdf_data: Dict) -> Optional[Dict]:
        """
        FIX 52 + M-6: All Unicode dash variants handled. Broader _DASH class
        covers hyphen, en-dash, em-dash, minus, colon, and space.
        """
        # M-6: broad dash class covering all separator variants
        _DASH = r'[\s\-\u2013\u2014\u2212:]*\s*'

        co2_pat = re.compile(rf'co2{_DASH}([\d,]+\.?\d*)\s*(?:tons?|tco2e?)?', re.I)
        ch4_pat = re.compile(rf'ch4{_DASH}([\d,]+\.?\d*)\s*(?:tco2e?|tons?)?', re.I)
        n2o_pat = re.compile(rf'n2o{_DASH}([\d,]+\.?\d*)\s*(?:tco2e?|tons?)?', re.I)

        # FIX 52: improved inline single-value pattern
        scope1_inline = re.compile(
            r'scope\s*1[^0-9]{0,60}?([\d,]+\.?\d*)\s*(?:tco2e?|tons?|tonnes?)', re.I
        )

        for page_info in pdf_data.get('pages', []):
            text = page_info.get('text', '')
            page_num = page_info.get('page_number', 0)

            m = scope1_inline.search(text)
            if m:
                try:
                    val = float(m.group(1).replace(',', ''))
                    if val >= 100:
                        print(f"    [TR] SCOPE_1 inline match: {val} on page {page_num}")
                        return {
                            'normalized_metric': 'SCOPE_1',
                            'value': val,
                            'unit': 'tCO2e',
                            'entity_text': m.group(0)[:100],
                            'context': text[max(0, m.start()-50):m.end()+50][:200],
                            'section_type': 'Environmental',
                            'confidence': 0.75,
                            'validation_status': 'VALID',
                            'validation_issues': ['paragraph_fallback'],
                            'source_type': 'paragraph',
                            'page': page_num,
                        }
                except (ValueError, AttributeError):
                    pass

            if not re.search(r'scope\s*1', text, re.I):
                continue

            co2_m = co2_pat.search(text)
            ch4_m = ch4_pat.search(text)
            n2o_m = n2o_pat.search(text)

            if co2_m:
                try:
                    co2_val = float(co2_m.group(1).replace(',', ''))
                    ch4_val = float(ch4_m.group(1).replace(',', '')) if ch4_m else 0.0
                    n2o_val = float(n2o_m.group(1).replace(',', '')) if n2o_m else 0.0
                    total = co2_val + ch4_val + n2o_val
                    if total >= 100:
                        print(f"    [TR] SCOPE_1 component sum: CO2={co2_val} + "
                              f"CH4={ch4_val} + N2O={n2o_val} = {total} on page {page_num}")
                        return {
                            'normalized_metric': 'SCOPE_1',
                            'value': round(total, 2),
                            'unit': 'tCO2e',
                            'entity_text': "CO2+CH4+N2O sum",
                            'context': f"CO2={co2_val}, CH4={ch4_val}, N2O={n2o_val}",
                            'section_type': 'Environmental',
                            'confidence': 0.80,
                            'validation_status': 'VALID',
                            'validation_issues': ['component_sum_fallback'],
                            'source_type': 'paragraph',
                            'page': page_num,
                        }
                except (ValueError, AttributeError):
                    pass

        return None

    @classmethod
    def _extract_energy(cls, rows: List[Dict]) -> Optional[Dict]:
        """
        FIX 50: Two-pass approach.
        Pass 1 — formula rows (A+B+C+D+E+F). Grand total, always correct.
        Pass 2 — generic patterns, but SKIP single-letter sub-rows like "(A)".
        """
        # Pass 1: formula-row candidates
        formula_candidates = []
        formula_patterns = cls.ENERGY_PATTERNS[:3]
        for pattern in formula_patterns:
            for row_info in rows:
                row_text = row_info['text']
                if cls._is_rejected(row_text):
                    continue
                if pattern.search(row_text):
                    value = cls._extract_first_valid_number(row_text, min_value=500)
                    if value is not None and value >= 10000:
                        score = cls._score_row(row_text) + 10
                        formula_candidates.append({
                            'row_text': row_text,
                            'value': value,
                            'page': row_info['page'],
                            'score': score,
                        })

        if formula_candidates:
            best = max(formula_candidates, key=lambda c: c['score'])
            unit = cls._detect_energy_unit(best['row_text'])
            print(f"[DEBUG] Selected row: {best['row_text'][:80]}   value: {best['value']}")
            return {
                'normalized_metric': 'ENERGY_CONSUMPTION',
                'value': best['value'],
                'unit': unit,
                'entity_text': best['row_text'][:100],
                'context': best['row_text'][:200],
                'section_type': 'Environmental',
                'confidence': CONFIDENCE_TABLE_TOTAL,
                'validation_status': 'VALID',
                'validation_issues': [],
                'source_type': 'table_reconstructed',
                'page': best['page'],
            }

        # Pass 2: generic patterns — skip single-letter sub-rows
        generic_candidates = []
        for pat_idx, pattern in enumerate(cls.ENERGY_PATTERNS[3:], start=3):
            for row_info in rows:
                row_text = row_info['text']
                if cls._is_rejected(row_text):
                    continue
                # FIX 50: skip sub-component rows ending with "(A)", "(B)" etc.
                if cls._ENERGY_SUB_ROW_RE.search(row_text.strip()):
                    print(f"         [DEBUG-E] Sub-row skipped (single-letter suffix): {row_text[:60]}")
                    continue
                if pattern.search(row_text):
                    value = cls._extract_first_valid_number(row_text, min_value=500)
                    if value is not None and value >= 10000:
                        score = cls._score_row(row_text)
                        # v9.0: also apply score bonus for formula-like content
                        if re.search(r'\(a\+b\+c\+d\+e\+f\)', row_text, re.I):
                            score += 15
                        score += (len(cls.ENERGY_PATTERNS) - pat_idx) * 2
                        generic_candidates.append({
                            'row_text': row_text,
                            'value': value,
                            'page': row_info['page'],
                            'score': score,
                        })

        if generic_candidates:
            best = max(generic_candidates, key=lambda c: c['score'])
            unit = cls._detect_energy_unit(best['row_text'])
            print(f"[DEBUG] Selected row: {best['row_text'][:80]}   value: {best['value']}")
            return {
                'normalized_metric': 'ENERGY_CONSUMPTION',
                'value': best['value'],
                'unit': unit,
                'entity_text': best['row_text'][:100],
                'context': best['row_text'][:200],
                'section_type': 'Environmental',
                'confidence': CONFIDENCE_TABLE_TOTAL if 'total' in best['row_text'].lower() else CONFIDENCE_TABLE_ONLY,
                'validation_status': 'VALID',
                'validation_issues': [],
                'source_type': 'table_reconstructed',
                'page': best['page'],
            }

        return None

    @classmethod
    def _extract_waste(cls, rows: List[Dict]) -> Optional[Dict]:
        """
        FIX 51: Three-pass approach.
        Pass 1 — grand-total formula row "Total (A+B+C+D+E+F+G+H)".
        Pass 2 — "total waste" row.
        Pass 3 — aggregate all waste sub-category rows.
        """
        # Pass 1: formula row
        formula_candidates = []
        for row_info in rows:
            row_text = row_info['text']
            if cls._is_rejected(row_text):
                continue
            if cls._WASTE_FORMULA_RE.search(row_text):
                value = cls._extract_first_valid_number(row_text, min_value=1)
                if value is not None and value > 0:
                    score = cls._score_row(row_text) + 15
                    formula_candidates.append({
                        'row_text': row_text,
                        'value': value,
                        'page': row_info['page'],
                        'score': score,
                    })

        if formula_candidates:
            best = max(formula_candidates, key=lambda c: c['score'])
            print(f"[DEBUG] Selected row (waste formula): {best['row_text'][:80]}   value: {best['value']}")
            return {
                'normalized_metric': 'WASTE_GENERATED',
                'value': best['value'],
                'unit': cls._detect_waste_unit(best['row_text']),
                'entity_text': best['row_text'][:100],
                'context': best['row_text'][:200],
                'section_type': 'Environmental',
                'confidence': CONFIDENCE_TABLE_TOTAL,
                'validation_status': 'VALID',
                'validation_issues': [],
                'source_type': 'table_reconstructed',
                'page': best['page'],
            }

        # Pass 2: "total waste" row
        total_candidates = []
        for row_info in rows:
            row_text = row_info['text']
            if cls._is_rejected(row_text):
                continue
            if re.search(r'total\s+waste', row_text, re.I):
                value = cls._extract_first_valid_number(row_text, min_value=10)
                if value is not None:
                    score = cls._score_row(row_text)
                    total_candidates.append({
                        'row_text': row_text,
                        'value': value,
                        'page': row_info['page'],
                        'score': score,
                    })

        if total_candidates:
            best = max(total_candidates, key=lambda c: c['score'])
            print(f"[DEBUG] Selected row (total waste): {best['row_text'][:80]}   value: {best['value']}")
            return {
                'normalized_metric': 'WASTE_GENERATED',
                'value': best['value'],
                'unit': cls._detect_waste_unit(best['row_text']),
                'entity_text': best['row_text'][:100],
                'context': best['row_text'][:200],
                'section_type': 'Environmental',
                'confidence': CONFIDENCE_TABLE_TOTAL,
                'validation_status': 'VALID',
                'validation_issues': [],
                'source_type': 'table_reconstructed',
                'page': best['page'],
            }

        # Pass 3: aggregate categories
        total = 0.0
        pages = []
        contexts = []
        seen_categories = set()

        for row_info in rows:
            row_text = row_info['text']
            if cls._is_rejected(row_text):
                continue
            row_lower = row_text.lower()
            matched = any(pat.search(row_text) for pat in cls.WASTE_PATTERNS)
            if not matched:
                continue
            category_key = re.sub(r'[\d,.\s]+', '', row_lower)[:30]
            if category_key in seen_categories:
                continue
            seen_categories.add(category_key)
            value = cls._extract_first_valid_number(row_text, min_value=0.1)
            if value is not None and value > 0:
                total += value
                pages.append(row_info['page'])
                contexts.append(row_text[:80])

        if total > 0:
            return {
                'normalized_metric': 'WASTE_GENERATED',
                'value': round(total, 2),
                'unit': 'MT',
                'entity_text': f"Aggregated waste ({len(contexts)} categories)",
                'context': "; ".join(contexts[:3])[:200],
                'section_type': 'Environmental',
                'confidence': CONFIDENCE_TABLE_ONLY,
                'validation_status': 'VALID',
                'validation_issues': ['aggregated_from_categories'],
                'source_type': 'table_reconstructed',
                'page': pages[0] if pages else 0,
            }

        return None

    @classmethod
    def _extract_water(cls, rows: List[Dict]) -> Optional[Dict]:
        # Priority 1: water consumption
        consumption_candidates = []
        for row_info in rows:
            row_text = row_info['text']
            if cls._is_rejected(row_text):
                continue
            if re.search(r'water\s+consumption', row_text, re.I):
                value = cls._extract_first_valid_number(row_text, min_value=100)
                if value is not None and value >= 10000:
                    score = cls._score_row(row_text)
                    consumption_candidates.append({
                        'row_text': row_text, 'value': value,
                        'page': row_info['page'], 'score': score,
                    })

        if consumption_candidates:
            best = max(consumption_candidates, key=lambda c: c['score'])
            print(f"[DEBUG] Selected row: {best['row_text'][:80]}   value: {best['value']}")
            return {
                'normalized_metric': 'WATER_USAGE',
                'value': best['value'],
                'unit': cls._detect_water_unit(best['row_text']),
                'entity_text': best['row_text'][:100],
                'context': best['row_text'][:200],
                'section_type': 'Environmental',
                'confidence': CONFIDENCE_TABLE_TOTAL,
                'validation_status': 'VALID',
                'validation_issues': [],
                'source_type': 'table_reconstructed',
                'page': best['page'],
            }

        # Priority 2: total water
        total_water_candidates = []
        for row_info in rows:
            row_text = row_info['text']
            if cls._is_rejected(row_text):
                continue
            if re.search(r'total\s+water', row_text, re.I):
                value = cls._extract_first_valid_number(row_text, min_value=100)
                if value is not None and value >= 10000:
                    score = cls._score_row(row_text)
                    total_water_candidates.append({
                        'row_text': row_text, 'value': value,
                        'page': row_info['page'], 'score': score,
                    })

        if total_water_candidates:
            best = max(total_water_candidates, key=lambda c: c['score'])
            print(f"[DEBUG] Selected row: {best['row_text'][:80]}   value: {best['value']}")
            return {
                'normalized_metric': 'WATER_USAGE',
                'value': best['value'],
                'unit': cls._detect_water_unit(best['row_text']),
                'entity_text': best['row_text'][:100],
                'context': best['row_text'][:200],
                'section_type': 'Environmental',
                'confidence': CONFIDENCE_TABLE_TOTAL,
                'validation_status': 'VALID',
                'validation_issues': [],
                'source_type': 'table_reconstructed',
                'page': best['page'],
            }

        # Priority 3: aggregate sources
        total = 0.0
        pages = []
        contexts = []
        seen_sources = set()

        for row_info in rows:
            row_text = row_info['text']
            if cls._is_rejected(row_text):
                continue
            row_lower = row_text.lower()
            is_water_source = any(
                word in row_lower
                for word in ['groundwater', 'ground water', 'surface water',
                             'third party', 'municipal water', 'tanker water', 'rainwater']
            )
            if not is_water_source:
                continue
            source_key = re.sub(r'[\d,.\s]+', '', row_lower)[:30]
            if source_key in seen_sources:
                continue
            seen_sources.add(source_key)
            value = cls._extract_first_valid_number(row_text, min_value=10)
            if value is not None and value > 0:
                total += value
                pages.append(row_info['page'])
                contexts.append(row_text[:80])

        if total >= 10000:
            return {
                'normalized_metric': 'WATER_USAGE',
                'value': round(total, 2),
                'unit': 'KL',
                'entity_text': f"Aggregated water ({len(contexts)} sources)",
                'context': "; ".join(contexts[:3])[:200],
                'section_type': 'Environmental',
                'confidence': CONFIDENCE_TABLE_ONLY,
                'validation_status': 'VALID',
                'validation_issues': ['aggregated_from_sources'],
                'source_type': 'table_reconstructed',
                'page': pages[0] if pages else 0,
            }

        return None

    # ------------------------------------------------------------------
    # UNIT DETECTION HELPERS
    # ------------------------------------------------------------------

    @staticmethod
    def _detect_emission_unit(text: str) -> str:
        text_lower = text.lower()
        if 'mtco2' in text_lower or 'mt co2' in text_lower:
            return 'MtCO2e'
        if 'ktco2' in text_lower:
            return 'ktCO2e'
        if 'tco2' in text_lower or 'tonnes co2' in text_lower or 'metric tonnes' in text_lower:
            return 'tCO2e'
        if 'co2' in text_lower or 'carbon' in text_lower or 'ghg' in text_lower:
            return 'tCO2e'
        if 'tonnes' in text_lower or 'metric ton' in text_lower:
            return 'tCO2e'
        return 'tCO2e'

    @staticmethod
    def _detect_energy_unit(text: str) -> str:
        text_lower = text.lower()
        if 'gwh' in text_lower:
            return 'GWh'
        if 'mwh' in text_lower:
            return 'MWh'
        if 'kwh' in text_lower:
            return 'kWh'
        if 'tj' in text_lower:
            return 'TJ'
        if 'gj' in text_lower:
            return 'GJ'
        if 'mj' in text_lower:
            return 'MJ'
        if 'mn kwh' in text_lower or 'million kwh' in text_lower:
            return 'Mn kWh'
        return 'GJ'  # FIX 50: default GJ (BRSR tables typically use GJ)

    @staticmethod
    def _detect_waste_unit(text: str) -> str:
        text_lower = text.lower()
        if 'kg' in text_lower:
            return 'kg'
        if 'mt' in text_lower or 'metric ton' in text_lower:
            return 'MT'
        if 'tonnes' in text_lower or 'tons' in text_lower:
            return 'MT'
        return 'MT'

    @staticmethod
    def _detect_water_unit(text: str) -> str:
        text_lower = text.lower()
        if 'kl' in text_lower or 'kilolitre' in text_lower or 'kiloliter' in text_lower:
            return 'KL'
        if 'm3' in text_lower or 'm³' in text_lower or 'cubic' in text_lower:
            return 'KL'
        if 'ml' in text_lower and 'million' in text_lower:
            return 'ML'
        return 'KL'

    # ------------------------------------------------------------------
    # SOCIAL / GOVERNANCE METRIC EXTRACTION
    # ------------------------------------------------------------------

    @classmethod
    def _extract_gender_diversity(cls, rows: List[Dict]) -> Optional[Dict]:
        candidates = []
        gender_target_re = re.compile(
            r'\b(target(?:ing|ed)?|goal|aim(?:ing)?|aspir|by\s+fy\s*20\d{2})\b', re.I
        )
        for pattern in cls.GENDER_DIVERSITY_PATTERNS:
            for row_info in rows:
                row_text = row_info['text']
                if cls._is_rejected(row_text):
                    continue
                if gender_target_re.search(row_text):
                    continue
                if pattern.search(row_text):
                    value = cls._extract_first_valid_number(row_text, min_value=0.1)
                    if value is not None and 0 < value <= 100:
                        score = cls._score_row(row_text)
                        row_lower = row_text.lower()
                        if any(w in row_lower for w in ['total employees', 'permanent', 'workforce']):
                            score += 3
                        if '%' in row_text or 'percent' in row_lower:
                            score += 1
                        candidates.append({
                            'row_text': row_text, 'value': value,
                            'page': row_info['page'], 'score': score,
                        })

        if candidates:
            best = max(candidates, key=lambda c: c['score'])
            return {
                'normalized_metric': 'GENDER_DIVERSITY',
                'value': best['value'],
                'unit': '%',
                'entity_text': best['row_text'][:100],
                'context': best['row_text'][:200],
                'section_type': 'Social',
                'confidence': CONFIDENCE_TABLE_TOTAL if 'total' in best['row_text'].lower() else CONFIDENCE_TABLE_ONLY,
                'validation_status': 'VALID',
                'validation_issues': [],
                'source_type': 'table_reconstructed',
                'page': best['page'],
            }
        return None

    @classmethod
    def _extract_safety_incidents(cls, rows: List[Dict]) -> Optional[Dict]:
        """
        FIX 55: Cross-contamination guard — rows matching DATA_BREACHES or
        COMPLAINTS patterns are rejected to prevent cross-metric contamination.
        """
        candidates = []
        for pattern in cls.SAFETY_INCIDENTS_PATTERNS:
            for row_info in rows:
                row_text = row_info['text']
                if cls._is_rejected(row_text):
                    continue

                # FIX 55: cross-contamination guard
                if cls._DATA_BREACH_CROSS_RE.search(row_text):
                    print(f"         [DEBUG-S] Safety row rejected (breach cross-match): {row_text[:60]}")
                    continue
                if cls._COMPLAINT_CROSS_RE.search(row_text):
                    print(f"         [DEBUG-S] Safety row rejected (complaint cross-match): {row_text[:60]}")
                    continue

                if pattern.search(row_text):
                    row_lower = row_text.lower()
                    if re.search(r'\b(no\s+incidents?|nil|zero\s+incidents?|0\s+incidents?)\b', row_lower):
                        candidates.append({
                            'row_text': row_text, 'value': 0,
                            'page': row_info['page'], 'score': cls._score_row(row_text) + 3,
                        })
                        continue
                    value = cls._extract_first_valid_number(row_text, min_value=0.0)
                    if value is not None and value >= 0:
                        score = cls._score_row(row_text)
                        candidates.append({
                            'row_text': row_text, 'value': value,
                            'page': row_info['page'], 'score': score,
                        })

        if candidates:
            best = max(candidates, key=lambda c: c['score'])
            return {
                'normalized_metric': 'SAFETY_INCIDENTS',
                'value': best['value'],
                'unit': '',
                'entity_text': best['row_text'][:100],
                'context': best['row_text'][:200],
                'section_type': 'Social',
                'confidence': CONFIDENCE_TABLE_TOTAL if 'total' in best['row_text'].lower() else CONFIDENCE_TABLE_ONLY,
                'validation_status': 'VALID',
                'validation_issues': [],
                'source_type': 'table_reconstructed',
                'page': best['page'],
            }
        return None

    @classmethod
    def _extract_employee_wellbeing(cls, rows: List[Dict]) -> Optional[Dict]:
        candidates = []
        for pattern in cls.EMPLOYEE_WELLBEING_PATTERNS:
            for row_info in rows:
                row_text = row_info['text']
                if cls._is_rejected(row_text):
                    continue
                if pattern.search(row_text):
                    value = cls._extract_first_valid_number(row_text, min_value=0.1)
                    if value is not None and value > 0:
                        row_lower = row_text.lower()
                        is_rate = any(w in row_lower for w in ['rate', '%', 'percent', 'ratio'])
                        if is_rate and value > 100:
                            continue
                        score = cls._score_row(row_text)
                        candidates.append({
                            'row_text': row_text, 'value': value,
                            'page': row_info['page'], 'score': score,
                        })

        if candidates:
            best = max(candidates, key=lambda c: c['score'])
            row_lower = best['row_text'].lower()
            is_pct = any(w in row_lower for w in ['rate', '%', 'percent', 'ratio', 'turnover', 'attrition'])
            unit = '%' if is_pct else ''
            return {
                'normalized_metric': 'EMPLOYEE_WELLBEING',
                'value': best['value'],
                'unit': unit,
                'entity_text': best['row_text'][:100],
                'context': best['row_text'][:200],
                'section_type': 'Social',
                'confidence': CONFIDENCE_TABLE_TOTAL if 'total' in row_lower else CONFIDENCE_TABLE_ONLY,
                'validation_status': 'VALID',
                'validation_issues': [],
                'source_type': 'table_reconstructed',
                'page': best['page'],
            }
        return None

    @classmethod
    def _extract_data_breaches(cls, rows: List[Dict],
                               pdf_data: Optional[Dict] = None) -> Optional[Dict]:
        """
        FIX 53 + M-2: Two-tier nil detection.
        Pass 0a — page-level scan: breach context + nil on same line OR within window.
        Pass 0b — row-level scan: row has both breach context AND nil (from v9.0).
        Pass 0c — same-page nil row near a breach-context row (from v9.0).
        Pass 1  — numeric extraction fallback.
        """
        # Pass 0a: page-level nil scan (FIX 53)
        if pdf_data:
            for page_info in pdf_data.get('pages', []):
                text = page_info.get('text', '')
                page_num = page_info.get('page_number', 0)
                for line in text.splitlines():
                    if cls.DATA_BREACHES_CONTEXT_RE.search(line) and cls._NIL_RE.search(line):
                        print(f"    [TR] DATA_BREACHES nil detected on page {page_num}: {line[:80]}")
                        return cls._zero_breach_result(line, page_num)
                # Window scan: breach keyword with nil within 200 chars
                breach_matches = [m for m in cls.DATA_BREACHES_CONTEXT_RE.finditer(text)]
                for bm in breach_matches:
                    window = text[max(0, bm.start()-100):bm.end()+200]
                    if cls._NIL_RE.search(window):
                        print(f"    [TR] DATA_BREACHES nil window-detected on page {page_num}")
                        return cls._zero_breach_result(window[:100], page_num)

        # Pass 0b: row-level context+nil (from v9.0)
        data_breach_context_re_local = re.compile(
            r'data\s+breach|cyber\s*(?:security)?\s*incident|privacy\s+breach'
            r'|instances?\s+of\s+data|number\s+of\s+instances',
            re.I
        )
        for row_info in rows:
            row_text = row_info['text']
            if data_breach_context_re_local.search(row_text) and cls._NIL_RE.search(row_text):
                print(f"    [TR] DATA_BREACHES nil (context+nil row): {row_text[:80]}")
                return cls._zero_breach_result(row_text, row_info['page'])

        # Pass 0c: same-page nil row near breach context (from v9.0)
        breach_page = None
        for row_info in rows:
            if data_breach_context_re_local.search(row_info['text']):
                breach_page = row_info['page']
                break
        if breach_page is not None:
            for row_info in rows:
                if row_info['page'] == breach_page and cls._NIL_RE.search(row_info['text']):
                    print(f"    [TR] DATA_BREACHES nil (same-page nil): {row_info['text'][:80]}")
                    return cls._zero_breach_result(row_info['text'], row_info['page'])

        # Pass 1: numeric extraction
        candidates = []
        for pattern in cls.DATA_BREACHES_PATTERNS:
            for row_info in rows:
                row_text = row_info['text']
                if cls._is_rejected(row_text):
                    continue
                if pattern.search(row_text):
                    row_lower = row_text.lower()
                    if cls._NIL_RE.search(row_lower):
                        candidates.append({
                            'row_text': row_text, 'value': 0,
                            'page': row_info['page'], 'score': 20,
                        })
                        continue
                    value = cls._extract_first_valid_number(row_text, min_value=0.0)
                    if value is not None and value >= 0:
                        if value > 10000:
                            continue
                        score = cls._score_row(row_text)
                        candidates.append({
                            'row_text': row_text, 'value': value,
                            'page': row_info['page'], 'score': score,
                        })

        if candidates:
            best = max(candidates, key=lambda c: c['score'])
            return {
                'normalized_metric': 'DATA_BREACHES',
                'value': best['value'],
                'unit': '',
                'entity_text': best['row_text'][:100],
                'context': best['row_text'][:200],
                'section_type': 'Governance',
                'confidence': 0.95 if best['value'] == 0 else (
                    CONFIDENCE_TABLE_TOTAL if 'total' in best['row_text'].lower()
                    else CONFIDENCE_TABLE_ONLY),
                'validation_status': 'VALID',
                'validation_issues': [],
                'source_type': 'table_reconstructed',
                'page': best['page'],
            }
        return None

    @staticmethod
    def _zero_breach_result(row_text: str, page: int) -> Dict:
        """M-1: Helper — return a zero DATA_BREACHES result dict."""
        return {
            'normalized_metric': 'DATA_BREACHES',
            'value': 0,
            'unit': '',
            'entity_text': row_text[:100],
            'context': row_text[:200],
            'section_type': 'Governance',
            'confidence': 0.95,
            'validation_status': 'VALID',
            'validation_issues': ['nil_statement_detected'],
            'source_type': 'table_reconstructed',
            'page': page,
        }

    @classmethod
    def _extract_complaints(cls, rows: List[Dict]) -> Optional[Dict]:
        """
        FIX 54 + M-3: Extended internal reject; customer row minimum is 1,000.
        Reject POSH, H-Response/employee grievances, shareholder, whistleblower,
        communities, value chain, discrimination, child/forced labour, wages.
        """
        internal_complaints_re = re.compile(
            r'\b(posh|sexual\s+harassment|h.?response|whistleblower|shareholder'
            r'|investor|discrimination|child\s+labour|forced\s+labour|wages'
            r'|employee[s]?(?:\s+and\s+workers?)?|workers?\s+complaint'
            r'|community|communities|value\s+chain|employee\s+grievance'
            r'|ngos?\b|per\s+employee|per\s+100)\b',
            re.I
        )

        candidates = []

        for pattern in cls.COMPLAINTS_PATTERNS:
            for row_info in rows:
                row_text = row_info['text']
                if cls._is_rejected(row_text):
                    continue

                row_lower = row_text.lower()
                if 'per employee' in row_lower or 'per 100' in row_lower:
                    continue
                if internal_complaints_re.search(row_text):
                    continue

                if pattern.search(row_text):
                    value = cls._extract_first_valid_number(row_text, min_value=0.0)
                    if value is not None and value >= 0:
                        is_customer = bool(re.search(r'customer', row_text, re.I))

                        # M-3: Customer complaint rows must have substantial counts
                        # (>= 1,000). Small values are residual/pending, not annual totals.
                        if is_customer and value < 1000:
                            print(f"         [DEBUG-C] Customer complaint too small ({value}), skipping")
                            continue

                        score = cls._score_row(row_text)
                        if is_customer:
                            score += 10
                        if re.search(r'\b(total|overall)\b', row_text, re.I):
                            score += 3
                        candidates.append({
                            'row_text': row_text,
                            'value': value,
                            'page': row_info['page'],
                            'score': score,
                        })

        if candidates:
            best = max(candidates, key=lambda c: c['score'])
            return {
                'normalized_metric': 'COMPLAINTS',
                'value': best['value'],
                'unit': '',
                'entity_text': best['row_text'][:100],
                'context': best['row_text'][:200],
                'section_type': 'Governance',
                'confidence': CONFIDENCE_TABLE_TOTAL if 'total' in best['row_text'].lower() else CONFIDENCE_TABLE_ONLY,
                'validation_status': 'VALID',
                'validation_issues': [],
                'source_type': 'table_reconstructed',
                'page': best['page'],
            }
        return None


# ============================================================================
# LAYER 1b: ENHANCED TABLE PARSER (pdfplumber tables)
# ============================================================================

class EnhancedTableParser:
    """
    Enhanced table parser using pdfplumber's extract_tables() output.
    FIX 50: energy sub-row filtering applied here too.
    M-7: METRIC_SYNONYMS expanded with formula-row labels.
    """

    METRIC_SYNONYMS = {
        'SCOPE_1': [
            'scope 1', 'scope1', 'direct emissions', 'scope i', 'scope one',
            'ghg scope 1', 'carbon scope 1', 'co2 scope 1', 'scope 1 emissions'
        ],
        'SCOPE_2': [
            'scope 2', 'scope2', 'indirect emissions', 'scope ii', 'scope two',
            'ghg scope 2', 'purchased electricity', 'scope 2 emissions'
        ],
        'SCOPE_3': [
            'scope 3', 'scope3', 'value chain emissions', 'scope iii', 'scope three',
            'other indirect emissions', 'supply chain emissions', 'scope 3 emissions'
        ],
        'ENERGY_CONSUMPTION': [
            'energy consumption', 'total energy', 'energy use', 'electricity consumption',
            'fuel consumption', 'primary energy', 'energy purchased',
            # M-7: formula-row label (FIX 50)
            'total energy consumed (a+b+c+d+e+f)',
        ],
        'WATER_USAGE': [
            'water usage', 'water consumption', 'water withdrawal', 'total water',
            'water use', 'fresh water', 'water intake'
        ],
        'WASTE_GENERATED': [
            'waste generated', 'total waste', 'solid waste', 'hazardous waste',
            'non-hazardous waste', 'waste disposal', 'waste produced',
            # M-7: formula-row label (FIX 51)
            'total (a+b + c + d + e + f + g + h)',
        ],
        'GENDER_DIVERSITY': [
            'gender diversity', 'women employees', 'female employees', 'women in workforce',
            'female representation', 'gender ratio', 'workforce diversity'
        ],
        'SAFETY_INCIDENTS': [
            'safety incidents', 'lost time injury', 'ltifr', 'fatalities',
            'recordable incidents', 'occupational injuries', 'workplace accidents'
        ],
        'EMPLOYEE_WELLBEING': [
            'employee wellbeing', 'employee well-being', 'training hours',
            'employee turnover', 'attrition rate', 'employee satisfaction'
        ],
        'DATA_BREACHES': [
            'data breaches', 'data breach', 'cyber incidents', 'cybersecurity incidents',
            'privacy breaches', 'security incidents', 'data leaks'
        ],
        'COMPLAINTS': [
            'complaints', 'grievances', 'whistleblower complaints',
            'ethics complaints', 'consumer complaints', 'customer complaints'
        ],
    }

    YEAR_PATTERN = re.compile(r'\b(?:FY\s*)?(?:20\d{2}|19\d{2}|\d{2})\b', re.IGNORECASE)
    UNIT_PATTERN = re.compile(
        r'\b(?:tCO2e|MtCO2e|ktCO2e|kgCO2e|GWh|MWh|kWh|m³|m3|KL|kl|'
        r'MT|tonnes|kg|%|MJ|GJ)\b', re.IGNORECASE
    )
    REJECT_PATTERNS = [
        re.compile(r'\bper\s+(employee|fte|unit|tonne|kwh|mwh|revenue|capita)', re.I),
        re.compile(r'\bintensity\b', re.I),
        re.compile(r'\btarget\b', re.I),
        re.compile(r'\breduction\b', re.I),
        re.compile(r'\bprojection\b', re.I),
        re.compile(r'\bforecast\b', re.I),
        re.compile(r'[\d.]+\s*/\s*(employee|unit|tonne|kwh)', re.I),
    ]
    ESG_ROW_KEYWORDS = re.compile(
        r'\b(scope\s*1|scope\s*2|scope\s*3|energy|water|waste)\b', re.IGNORECASE
    )
    # FIX 50: sub-row pattern at EnhancedTableParser level
    _ENERGY_SUB_ROW_RE = re.compile(r'\(\s*[A-Fa-f]\s*\)\s*$')

    @classmethod
    def parse_tables(cls, tables_data: List[Dict], page_texts: Optional[List[Dict]] = None,
                     relaxed: bool = False) -> List[Dict]:
        all_metrics = []
        if tables_data:
            for table_info in tables_data:
                metrics = cls._parse_single_table(
                    table_info['table'], table_info['page'], relaxed=relaxed
                )
                all_metrics.extend(metrics)

        if not all_metrics and page_texts:
            legacy_parser = TableParserLegacy()
            for page in page_texts:
                rows = legacy_parser.parse_page(page['text'], page['page_number'], relaxed=relaxed)
                all_metrics.extend(rows)

        return all_metrics

    @classmethod
    def _parse_single_table(cls, table: List[List[str]], page_num: int,
                            relaxed: bool = False) -> List[Dict]:
        if not table or len(table) < 2:
            return []

        header_rows, data_start_idx = cls._detect_header_rows(table)

        if not header_rows:
            if relaxed:
                print(f"      [FIX 42] Header unclear on page {page_num}, using partial extraction")
                header_rows = [table[0]]
                data_start_idx = 1
            else:
                return []

        year_col_idx = cls._find_latest_year_column(header_rows)

        if year_col_idx < 0 and relaxed:
            year_col_idx = cls._find_first_numeric_column(table, data_start_idx)
            if year_col_idx >= 0:
                print(f"      [FIX 42] No year column found, using first numeric column {year_col_idx}")

        col_units = cls._extract_column_units(header_rows, table, data_start_idx)
        active_min_values = RELAXED_MIN_VALUES if relaxed else MIN_VALUES

        results = []
        num_rows = len(table)
        for row_idx in range(data_start_idx, num_rows):
            row = table[row_idx]
            if not row or len(row) < 2:
                continue

            metric_label = row[0].strip() if row[0] else ''
            if not metric_label:
                continue

            is_total = cls._is_total_row(metric_label, row_idx, num_rows)
            is_esg_keyword_row = bool(cls.ESG_ROW_KEYWORDS.search(metric_label))

            if not is_total and not (relaxed and is_esg_keyword_row):
                print(f"         [DEBUG] Row rejected: '{metric_label}' — "
                      f"no total keyword, not ESG keyword row (relaxed={relaxed})")
                continue

            canonical_metric = cls._map_metric(metric_label)
            if not canonical_metric:
                print(f"         [DEBUG] Row rejected: '{metric_label}' — no metric mapping found")
                continue

            # FIX 50: skip energy sub-rows at EnhancedTableParser level
            if canonical_metric == 'ENERGY_CONSUMPTION' and cls._ENERGY_SUB_ROW_RE.search(metric_label.strip()):
                print(f"         [DEBUG] Energy sub-row skipped: '{metric_label}'")
                continue

            effective_col = year_col_idx
            if effective_col < 0 or effective_col >= len(row):
                effective_col = cls._find_first_numeric_in_row(row)
                if effective_col < 0:
                    print(f"         [DEBUG] Row rejected: '{metric_label}' — no numeric column found")
                    continue

            value_cell = row[effective_col].strip() if row[effective_col] else ''
            if not value_cell:
                continue

            fallback_unit = col_units[effective_col] if effective_col < len(col_units) else ''
            value, unit = cls._extract_value_and_unit(value_cell, fallback_unit)
            if value is None:
                continue

            unit, value = ValueExtractor.canonicalize_unit(unit, canonical_metric, value)

            if canonical_metric in STRICT_UNIT_MAP and STRICT_UNIT_MAP[canonical_metric]:
                if unit not in STRICT_UNIT_MAP[canonical_metric]:
                    print(f"         [DEBUG] Row rejected: '{metric_label}' — "
                          f"invalid unit '{unit}' for {canonical_metric}")
                    continue

            min_val = active_min_values.get(canonical_metric, 0)
            if value < min_val:
                print(f"         [DEBUG] Row rejected: '{metric_label}' — "
                      f"value {value} below threshold {min_val}")
                continue

            context_str = ' '.join(row[:3]) + ' ' + ' '.join(header_rows[0][:3])
            if cls._is_rejected_context(context_str):
                print(f"         [DEBUG] Row rejected: '{metric_label}' — intensity/target context")
                continue

            confidence = CONFIDENCE_TABLE_TOTAL if is_total else CONFIDENCE_TABLE_ONLY

            results.append({
                'normalized_metric': canonical_metric,
                'value': value,
                'unit': unit,
                'entity_text': metric_label,
                'context': context_str[:200],
                'section_type': 'Environmental',
                'confidence': confidence,
                'validation_status': 'VALID',
                'validation_issues': [],
                'source_type': 'table',
                'page': page_num,
            })

        return results

    @classmethod
    def _find_first_numeric_column(cls, table: List[List[str]], data_start: int) -> int:
        for row in table[data_start:data_start + 3]:
            for col_idx in range(1, len(row)):
                cell = row[col_idx].strip() if row[col_idx] else ''
                if re.search(r'\d', cell):
                    return col_idx
        return -1

    @classmethod
    def _find_first_numeric_in_row(cls, row: List[str]) -> int:
        for col_idx in range(1, len(row)):
            cell = row[col_idx].strip() if row[col_idx] else ''
            if re.search(r'[\d,]+\.?\d*', cell) and not re.match(r'^(FY|fy|20\d{2}|19\d{2})$', cell.strip()):
                return col_idx
        return -1

    @classmethod
    def _is_total_row(cls, label: str, row_idx: int, total_rows: int) -> bool:
        label_lower = label.lower()
        if re.search(r'\b(total|grand total|overall|gross)\b', label_lower):
            return True
        if row_idx == total_rows - 1:
            return True
        return False

    @classmethod
    def _detect_header_rows(cls, table: List[List[str]]) -> Tuple[List[List[str]], int]:
        header_rows = []
        data_start = 0
        for i, row in enumerate(table):
            row_text = ' '.join([c for c in row if c]).lower()
            has_year = bool(cls.YEAR_PATTERN.search(row_text))
            has_unit = bool(cls.UNIT_PATTERN.search(row_text))
            numeric_cols = sum(1 for cell in row if re.search(r'\d', cell))
            if (has_year or has_unit) and numeric_cols <= len(row) // 2:
                header_rows.append(row)
            else:
                if header_rows:
                    data_start = i
                    break
                if i == 0 and not header_rows:
                    return [], 0
        if not header_rows:
            if len(table) > 1:
                header_rows = [table[0]]
                data_start = 1
            else:
                return [], 0
        return header_rows, data_start

    @classmethod
    def _find_latest_year_column(cls, header_rows: List[List[str]]) -> int:
        best_col = -1
        latest_year = 0
        for row in header_rows:
            for col_idx, cell in enumerate(row):
                if not cell:
                    continue
                years = cls.YEAR_PATTERN.findall(cell)
                for y_str in years:
                    year_digits = re.search(r'\d+', y_str)
                    if not year_digits:
                        continue
                    year_val = int(year_digits.group())
                    if year_val < 100:
                        year_val = 2000 + year_val if year_val >= 20 else 2000 + year_val
                    if year_val > latest_year:
                        latest_year = year_val
                        best_col = col_idx
        return best_col

    @classmethod
    def _extract_column_units(cls, header_rows: List[List[str]], table: List[List[str]], data_start: int) -> List[str]:
        num_cols = max(len(row) for row in table) if table else 0
        units = [''] * num_cols
        for row in header_rows:
            for col_idx, cell in enumerate(row):
                if col_idx < len(units) and cell:
                    unit_match = cls.UNIT_PATTERN.search(cell)
                    if unit_match:
                        units[col_idx] = unit_match.group(0).strip()
        if data_start < len(table):
            sample_row = table[data_start]
            for col_idx, cell in enumerate(sample_row):
                if col_idx < len(units) and not units[col_idx] and cell:
                    _, unit = cls._extract_value_and_unit(cell, '')
                    if unit:
                        units[col_idx] = unit
        return units

    @classmethod
    def _extract_value_and_unit(cls, cell: str, fallback_unit: str = '') -> Tuple[Optional[float], str]:
        cell_clean = cell.replace(',', '').strip()
        match = re.search(r'([\d.]+)\s*([a-zA-Z%³²]+)?', cell_clean)
        if not match:
            return None, ''
        try:
            value = float(match.group(1))
        except ValueError:
            return None, ''
        unit = match.group(2) if match.group(2) else ''
        if unit:
            unit = unit.strip()
        elif fallback_unit:
            unit = fallback_unit
        if unit:
            unit_lower = unit.lower()
            unit = UNIT_NORMALIZATION.get(unit_lower, unit)
        if value < 1 and unit != '%':
            return None, ''
        return value, unit

    @classmethod
    def _map_metric(cls, label: str) -> Optional[str]:
        label_lower = label.lower().strip()
        label_lower = re.sub(r'[^\w\s]', '', label_lower)
        best_match = None
        best_score = 0.0
        for metric, synonyms in cls.METRIC_SYNONYMS.items():
            if label_lower in synonyms:
                return metric
            for syn in synonyms:
                if syn in label_lower:
                    score = len(syn) / len(label_lower) if label_lower else 0
                    if score > best_score:
                        best_score = score
                        best_match = metric
        if best_score > 0.6:
            return best_match
        return None

    @classmethod
    def _is_rejected_context(cls, context: str) -> bool:
        context_lower = context.lower()
        for pattern in cls.REJECT_PATTERNS:
            if pattern.search(context_lower):
                return True
        return False


# ============================================================================
# LEGACY TABLE PARSER
# ============================================================================

class TableParserLegacy:
    """Text-block table parser (fallback). FIX 50 sub-row fix applied."""

    def parse_page(self, page_text: str, page_number: int, relaxed: bool = False) -> List[Dict]:
        self._relaxed = relaxed
        results = []
        blocks = re.split(r'\n\s*\n', page_text)
        for block in blocks:
            if self._is_table_block(block):
                rows = self._extract_table_rows(block, page_number)
                results.extend(rows)
        return results

    def _is_table_block(self, block: str) -> bool:
        lines_with_numbers = sum(1 for line in block.splitlines() if re.search(r'\b\d[\d,]*\.?\d*\b', line))
        return lines_with_numbers >= 3

    def _extract_table_rows(self, block: str, page_number: int) -> List[Dict]:
        lines = block.splitlines()
        if len(lines) < 2:
            return []
        header_idx, latest_col = self._detect_header_and_latest_col(lines)
        results = []
        header_line = lines[header_idx] if header_idx < len(lines) else ''
        header_unit = self._extract_unit_from_header(header_line)
        total_rows = len(lines)
        for row_idx, line in enumerate(lines[header_idx + 1:], start=header_idx+1):
            row = self._parse_data_row(line, latest_col, header_unit, page_number, row_idx, total_rows)
            if row:
                results.append(row)
        return results

    def _detect_header_and_latest_col(self, lines: List[str]) -> Tuple[int, int]:
        for i, line in enumerate(lines[:5]):
            year_matches = list(_YEAR_HEADER_RE.finditer(line))
            if year_matches:
                best_match = self._latest_year_match(year_matches, line)
                col_idx = self._match_to_col_index(line, best_match)
                return i, col_idx
            if _UNIT_PATTERNS_RE.search(line):
                return i, -1
        return 0, -1

    def _latest_year_match(self, matches: List[re.Match], line: str) -> re.Match:
        def year_value(m: re.Match) -> int:
            text = m.group().upper().replace('FY', '').replace(' ', '')
            try:
                y = int(text)
                return y + 2000 if y < 100 else y
            except ValueError:
                return 0
        return max(matches, key=year_value)

    def _match_to_col_index(self, line: str, match: re.Match) -> int:
        prefix = line[:match.start()]
        cols = re.split(r'\t|  +', prefix)
        return len(cols)

    def _extract_unit_from_header(self, header_line: str) -> str:
        m = _UNIT_PATTERNS_RE.search(header_line)
        if m:
            raw = m.group(1).strip()
            norm = UNIT_NORMALIZATION.get(raw.lower(), raw)
            if norm in VALID_UNITS:
                return norm
        return ''

    def _parse_data_row(self, line: str, latest_col: int, fallback_unit: str,
                        page_number: int, row_idx: int, total_rows: int) -> Optional[Dict]:
        if not line.strip():
            return None
        cols = re.split(r'\t|  +', line.strip())
        if not cols:
            return None
        metric_label = cols[0].strip()
        metric_name = self._map_metric(metric_label)
        if not metric_name:
            return None

        # FIX 50: skip energy sub-rows in legacy parser too
        if metric_name == 'ENERGY_CONSUMPTION':
            if re.search(r'\(\s*[A-Fa-f]\s*\)\s*$', metric_label.strip()):
                return None

        is_total = self._is_total_row(metric_label, row_idx, total_rows)
        is_esg_kw = bool(EnhancedTableParser.ESG_ROW_KEYWORDS.search(metric_label))
        relaxed = getattr(self, '_relaxed', False)
        if not is_total and not (relaxed and is_esg_kw):
            print(f"     [DEBUG-LEGACY] Row rejected: '{metric_label}' — "
                  f"no total keyword (relaxed={relaxed})")
            return None

        numeric_cols = []
        for idx, col in enumerate(cols[1:], start=1):
            col = col.strip()
            if any(p.search(col) for p in INTENSITY_PATTERNS):
                continue
            m = re.search(r'([\d,]+\.?\d*)', col)
            if not m:
                continue
            try:
                val = float(m.group(1).replace(',', ''))
            except ValueError:
                continue
            if val < 1 or (1900 <= val <= 2030) or val > 1e9:
                continue
            unit_m = _UNIT_PATTERNS_RE.search(col)
            unit = ''
            if unit_m:
                raw = unit_m.group(1).strip()
                unit = UNIT_NORMALIZATION.get(raw.lower(), raw)
                if unit not in VALID_UNITS:
                    unit = ''
            if not unit:
                unit = fallback_unit
            numeric_cols.append((idx, val, unit))
        if not numeric_cols:
            return None
        if latest_col > 0 and numeric_cols:
            max_col = numeric_cols[-1][0]
            effective_col = min(latest_col, max_col)
            chosen = min(numeric_cols, key=lambda x: abs(x[0] - effective_col))
        else:
            chosen = numeric_cols[-1]
        _, value, unit = chosen
        unit, value = ValueExtractor.canonicalize_unit(unit, metric_name, value)

        if metric_name in STRICT_UNIT_MAP and STRICT_UNIT_MAP[metric_name]:
            if unit not in STRICT_UNIT_MAP[metric_name]:
                return None

        active_mins = RELAXED_MIN_VALUES if getattr(self, '_relaxed', False) else MIN_VALUES
        min_val = active_mins.get(metric_name, 0)
        if value < min_val:
            print(f"     [DEBUG-LEGACY] Row rejected: '{metric_label}' — "
                  f"value {value} below threshold {min_val}")
            return None

        confidence = CONFIDENCE_TABLE_TOTAL if self._is_total_row(metric_label, row_idx, total_rows) else CONFIDENCE_TABLE_ONLY

        return {
            'normalized_metric': metric_name,
            'value': value,
            'unit': unit,
            'entity_text': metric_label,
            'context': line[:200],
            'section_type': 'Environmental',
            'confidence': confidence,
            'validation_status': 'VALID',
            'validation_issues': [],
            'source_type': 'table',
            'page': page_number,
        }

    def _is_total_row(self, label: str, row_idx: int, total_rows: int) -> bool:
        label_lower = label.lower()
        if re.search(r'\b(total|grand total|overall|gross)\b', label_lower):
            return True
        if row_idx == total_rows - 1:
            return True
        return False

    def _map_metric(self, label: str) -> Optional[str]:
        label_lower = label.lower().strip()
        for key, synonyms in EnhancedTableParser.METRIC_SYNONYMS.items():
            for syn in synonyms:
                if syn in label_lower:
                    return key
        return None


# ============================================================================
# LAYER 2-3: TEXT PREPROCESSOR
# ============================================================================

class TextPreprocessor:
    def __init__(self):
        self.esg_section_keywords = {
            'Environmental': ['environmental', 'climate', 'emissions', 'carbon', 'energy', 'water', 'waste'],
            'Social': ['social', 'employees', 'diversity', 'safety', 'training', 'labor'],
            'Governance': ['governance', 'board', 'ethics', 'compliance', 'risk']
        }

    def clean_text(self, text: str) -> str:
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'(\w+)-\s+(\w+)', r'\1\2', text)
        text = re.sub(r'\n\d+\n', '\n', text)
        return text.strip()

    def chunk_text(self, text: str, max_length: int = 512, overlap: int = 50) -> List[Dict]:
        chunks = []
        start = 0
        while start < len(text):
            end = start + max_length
            if end < len(text):
                period_pos = text.rfind('.', start, end)
                if period_pos > start + max_length - 100:
                    end = period_pos + 1
            chunk_text = text[start:end].strip()
            if chunk_text:
                section_type = self._classify_section(chunk_text)
                chunks.append({'text': chunk_text, 'start': start, 'end': end, 'section_type': section_type})
            start = end - overlap
        return chunks

    def _classify_section(self, text: str) -> str:
        text_lower = text.lower()
        scores = {
            'Environmental': sum(text_lower.count(kw) for kw in self.esg_section_keywords['Environmental']),
            'Social': sum(text_lower.count(kw) for kw in self.esg_section_keywords['Social']),
            'Governance': sum(text_lower.count(kw) for kw in self.esg_section_keywords['Governance'])
        }
        if max(scores.values()) == 0:
            return 'Unknown'
        return max(scores, key=scores.get)


# ============================================================================
# LAYER 4: ESG CANDIDATE FILTER
# ============================================================================

class ESGCandidateFilter:
    def __init__(self, model_path: Optional[str] = None, threshold: float = 0.5):
        self.threshold = threshold
        if model_path and Path(model_path).exists():
            print(f"Loading ESG filter model from {model_path}...")
            self.tokenizer = AutoTokenizer.from_pretrained(model_path)
            self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
            self.model.eval()
            self.use_model = True
        else:
            print("     ESG filter model not found. Using keyword-based filter (FIX 3 applied).")
            self.use_model = False
            self._init_keyword_filter()

    def _init_keyword_filter(self):
        self.esg_keywords = {
            'emissions', 'carbon', 'co2', 'ghg', 'scope', 'energy', 'renewable',
            'water', 'waste', 'recycling', 'employees', 'workforce', 'diversity',
            'safety', 'training', 'board', 'governance', 'ethics', 'compliance', 'esg',
            'sustainability', 'injury', 'turnover', 'attrition',
        }
        self.negative_keywords = {
            'revenue', 'profit', 'earnings', 'ebitda', 'cash flow', 'dividend',
            'stock price', 'market cap', 'valuation', 'debt',
            'litigation', 'lawsuit', 'arbitration',
        }

    def is_esg_candidate(self, text: str) -> Tuple[bool, float]:
        if self.use_model:
            return self._model_filter(text)
        return self._keyword_filter(text)

    def _model_filter(self, text: str) -> Tuple[bool, float]:
        inputs = self.tokenizer(text, max_length=256, padding=True, truncation=True, return_tensors="pt")
        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1)
            esg_prob = probs[0][1].item()
        return esg_prob > self.threshold, esg_prob

    def _keyword_filter(self, text: str) -> Tuple[bool, float]:
        text_lower = text.lower()
        keyword_count = sum(1 for kw in self.esg_keywords if kw in text_lower)
        negative_count = sum(1 for kw in self.negative_keywords if kw in text_lower)
        has_number = bool(re.search(r'\d+\.?\d*', text))
        if keyword_count < 2 or not has_number:
            return False, 0.0
        base_confidence = min(keyword_count / 5.0, 1.0)
        if base_confidence < 0.4:
            return False, base_confidence
        if negative_count > 0:
            base_confidence *= max(0.5, 1.0 - negative_count * 0.15)
        return True, base_confidence


# ============================================================================
# LAYER 5: NER MODEL
# ============================================================================

class ESGNERExtractor:
    def __init__(self, model_path: str):
        print(f"Loading NER model from {model_path}...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForTokenClassification.from_pretrained(model_path)
        self.model.eval()
        label_map_path = Path(model_path).parent / 'label_mappings.json'
        if label_map_path.exists():
            with open(label_map_path, 'r') as f:
                mappings = json.load(f)
                self.id2label = {int(k): v for k, v in mappings['id2label'].items()}
        else:
            self.id2label = self.model.config.id2label
        print(f" NER model loaded with {len(self.id2label)} labels")

    def extract_entities(self, text: str, section_type: str = "Unknown") -> List[Dict]:
        inputs = self.tokenizer(
            text, max_length=512, padding=True, truncation=True,
            return_tensors="pt", return_offsets_mapping=True
        )
        offset_mapping = inputs.pop('offset_mapping')[0]
        with torch.no_grad():
            outputs = self.model(**inputs)
            predictions = torch.argmax(outputs.logits, dim=2)[0]
            probs = torch.softmax(outputs.logits, dim=2)[0]
        entities = []
        current_entity = None
        for idx, (pred_id, prob_dist) in enumerate(zip(predictions, probs)):
            label = self.id2label.get(pred_id.item(), 'O')
            confidence = prob_dist[pred_id].item()
            if offset_mapping[idx][0] == offset_mapping[idx][1]:
                continue
            if label.startswith('B-'):
                if current_entity:
                    entities.append(current_entity)
                current_entity = {
                    'text': text[offset_mapping[idx][0]:offset_mapping[idx][1]],
                    'start': offset_mapping[idx][0].item(),
                    'end': offset_mapping[idx][1].item(),
                    'label': label[2:],
                    'confidence': confidence,
                    'section_type': section_type
                }
            elif label.startswith('I-') and current_entity:
                current_entity['text'] = text[current_entity['start']:offset_mapping[idx][1]]
                current_entity['end'] = offset_mapping[idx][1].item()
                current_entity['confidence'] = (current_entity['confidence'] + confidence) / 2
        if current_entity:
            entities.append(current_entity)
        return entities


# ============================================================================
# LAYER 6: METRIC CLASSIFIER
# ============================================================================

class MetricClassifier:
    def __init__(self, model_path: str):
        print(f"Loading Metric Classifier from {model_path}...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
        self.model.eval()
        label_map_path = Path(model_path).parent / 'label_mappings.json'
        if label_map_path.exists():
            with open(label_map_path, 'r') as f:
                mappings = json.load(f)
                self.id2label = {int(k): v for k, v in mappings['id2label'].items()}
        else:
            self.id2label = self.model.config.id2label
        print(f" Classifier loaded with {len(self.id2label)} classes (FIX 1: confidence gating @ 0.7)")

    def classify(self, metric_text: str, context: str, section_type: str = "") -> Tuple[str, float]:
        input_text = (
            f"[SECTION: {section_type}] "
            f"METRIC: {metric_text} "
            f"CONTEXT: {context}"
        )
        inputs = self.tokenizer(
            input_text, max_length=128, padding=True, truncation=True, return_tensors="pt"
        )
        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1)[0]
            pred_id = torch.argmax(probs).item()
            confidence = probs[pred_id].item()
        normalized_metric = self.id2label.get(pred_id, 'UNKNOWN')
        if confidence < 0.7:
            return "UNKNOWN", confidence
        if normalized_metric not in TARGET_METRICS:
            return "UNKNOWN", 0.0
        return normalized_metric, confidence


# ============================================================================
# LAYER 7-8: VALUE EXTRACTOR
# ============================================================================

_UNIT_PATTERNS_RE = re.compile(
    r'\b('
    r'tCO2e|MtCO2e|ktCO2e|kgCO2e|kgCO2|tCO2|tonnes\s+CO2|Mt\s+CO2e|'
    r'TCO2e|'
    r'GWh|MWh|kWh|Mn\s+kWh|GJ/tonne|MJ/unit|kWh/unit|TJ|PJ|GJ|MJ|'
    r'm³|m3|kiloliters|kilolitres|KL|kl|ML|GL|liters|litres|'
    r'MT|kt\b|tonnes\b|tonne\b|tons\b|ton\b|kg\b|'
    r'%'
    r')',
    re.IGNORECASE,
)


class ValueExtractor:
    UNIT_WINDOW = 50

    def __init__(self):
        self.patterns = [
            (r'([\d,]+\.?\d*)\s*(%)', 'pct'),
            (r'([\d,]+\.\d+)\s+([a-zA-Z/%³]+(?:\s+[a-zA-Z²³]+)?)', 'full_float'),
            (r'([\d,]+)\s+([a-zA-Z/%³]+(?:\s+[a-zA-Z²³]+)?)', 'full_int'),
            (r'([\d,]+\.\d+)', 'float_only'),
            (r'([\d,]+)', 'int_only'),
        ]
        self.confidence_map = {
            'pct':        0.95,
            'full_float': 0.90,
            'full_int':   0.85,
            'float_only': 0.60,
            'int_only':   0.50,
        }

    def extract_context(self, text: str, entity_start: int, entity_end: int, window: int = 150) -> str:
        sentence_context = self._extract_sentence_context(text, entity_start, entity_end)
        if sentence_context and len(sentence_context) >= 30:
            return sentence_context
        context_start = max(0, entity_start - window)
        context_end = min(len(text), entity_end + window)
        return text[context_start:context_end]

    def extract_value(self, context: str, entity_start_in_context: Optional[int] = None,
                      entity_end_in_context: Optional[int] = None,
                      classifier_confidence: float = 0.0) -> Optional[Dict]:
        if self._is_intensity_context(context):
            return None
        raw_candidates = self._extract_all_candidates(context)
        if not raw_candidates:
            return None
        candidates = [c for c in raw_candidates if self._is_valid_value(c, context)]
        if not candidates:
            return None
        candidates = self._fill_units_via_window(candidates, context)
        if self._is_tabular_context(context):
            candidates = self._table_aware_unit_match(candidates, context)
        scored = self._score_candidates(candidates, context)
        if scored:
            candidates = scored
        best = candidates[0]
        num_candidates = len(candidates)
        if not best['unit'] and best['confidence'] >= 0.5 and classifier_confidence >= 0.8:
            best = dict(best)
            best['unit'] = 'UNKNOWN'
            best['confidence'] *= 0.7
        result = {
            'value': best['value'],
            'unit': best['unit'],
            'confidence': best['confidence'],
            'num_candidates': num_candidates,
        }
        if num_candidates > 1:
            result['confidence'] *= 0.6
        return result

    def _score_candidates(self, candidates: List[Dict], context: str) -> List[Dict]:
        context_lower = context.lower()
        ctx_has_intensity = any(p.search(context) for p in INTENSITY_PATTERNS)
        ctx_has_target = bool(_TARGET_WORDS_RE.search(context))
        ctx_metric_kw = any(
            any(kw in context_lower for kw in kws)
            for kws in METRIC_KEYWORDS.values()
        )
        for c in candidates:
            score = 0
            lo = max(0, c['match_start'] - 80)
            hi = min(len(context), c['match_end'] + 80)
            local = context[lo:hi].lower()
            if 'total' in local:
                score += CTX_SCORE_WEIGHTS['total']
            if ctx_metric_kw:
                score += CTX_SCORE_WEIGHTS['metric_kw']
            if c['unit'] and c['unit'] != 'UNKNOWN':
                for valid_set in STRICT_UNIT_MAP.values():
                    if c['unit'] in valid_set:
                        score += CTX_SCORE_WEIGHTS['unit_match']
                        break
            if ctx_has_intensity:
                score += CTX_SCORE_WEIGHTS['intensity']
            if ctx_has_target:
                score += CTX_SCORE_WEIGHTS['target_word']
            c['_ctx_score'] = score
        return sorted(candidates, key=lambda c: (c['_ctx_score'], c['value']), reverse=True)

    @staticmethod
    def _is_intensity_context(context: str) -> bool:
        for pat in INTENSITY_PATTERNS:
            if pat.search(context):
                return True
        return False

    def _fill_units_via_window(self, candidates: List[Dict], context: str) -> List[Dict]:
        result = []
        for c in candidates:
            if c['unit']:
                result.append(c)
                continue
            lo = max(0, c['match_start'] - self.UNIT_WINDOW)
            hi = min(len(context), c['match_end'] + self.UNIT_WINDOW)
            window_text = context[lo:hi]
            unit_match = _UNIT_PATTERNS_RE.search(window_text)
            if unit_match:
                raw_unit = unit_match.group(1).strip()
                normalised = self._normalize_unit(raw_unit)
                if self._is_valid_unit(normalised):
                    c = dict(c)
                    c['unit'] = normalised
            result.append(c)
        return result

    def _is_tabular_context(self, context: str) -> bool:
        numbers = re.findall(r'\b\d[\d,]*\.?\d*\b', context)
        return len(numbers) >= 3

    def _table_aware_unit_match(self, candidates: List[Dict], context: str) -> List[Dict]:
        all_unit_spans = [
            (m.start(), m.end(), self._normalize_unit(m.group(1)))
            for m in _UNIT_PATTERNS_RE.finditer(context)
            if self._is_valid_unit(self._normalize_unit(m.group(1)))
        ]
        if not all_unit_spans:
            return candidates
        updated = []
        for c in candidates:
            if c['unit']:
                updated.append(c)
                continue
            num_mid = (c['match_start'] + c['match_end']) / 2
            best_span = min(all_unit_spans, key=lambda s: abs((s[0] + s[1]) / 2 - num_mid))
            c = dict(c)
            c['unit'] = best_span[2]
            updated.append(c)
        return updated

    def _extract_sentence_context(self, text: str, entity_start: int, entity_end: int) -> Optional[str]:
        sentence_boundaries = list(re.finditer(r'[.!?]\s+', text))
        if not sentence_boundaries:
            return None
        sentences, prev_end = [], 0
        for match in sentence_boundaries:
            sentences.append((prev_end, match.end()))
            prev_end = match.end()
        if prev_end < len(text):
            sentences.append((prev_end, len(text)))
        for i, (s_start, s_end) in enumerate(sentences):
            if s_start <= entity_start < s_end:
                end_idx = min(i + 1, len(sentences) - 1)
                return text[sentences[i][0]:sentences[end_idx][1]].strip()
        return None

    def _is_valid_value(self, candidate: Dict, context: str) -> bool:
        value = candidate['value']
        unit = candidate['unit']
        if value < 1 and unit != '%':
            return False
        if value > 1_000_000_000:
            return False
        if value in NOISE_VALUES and unit != '%':
            return False
        if 1900 <= value <= 2030:
            return False
        if _INVALID_CONTEXT_RE.search(context):
            return False
        return True

    def _extract_all_candidates(self, context: str) -> List[Dict]:
        candidates = []
        seen_spans = set()
        sci_spans = {(m.start(), m.end()) for m in _SCI_NOTATION_RE.finditer(context)}
        for pattern, pattern_type in self.patterns:
            for match in re.finditer(pattern, context, re.IGNORECASE):
                span = (match.start(), match.end())
                if any(self._spans_overlap(span, s) for s in seen_spans):
                    continue
                if any(self._spans_overlap((match.start(), match.start() + len(match.group(1))), s)
                       for s in sci_spans):
                    continue
                try:
                    value = float(match.group(1).replace(',', ''))
                except (ValueError, IndexError):
                    continue
                unit = ""
                if len(match.groups()) >= 2 and match.group(2):
                    unit_raw = match.group(2).strip()
                    unit = self._normalize_unit(unit_raw)
                if unit and not self._is_valid_unit(unit):
                    unit = ""
                candidates.append({
                    'value': value,
                    'unit': unit,
                    'confidence': self.confidence_map[pattern_type],
                    'match_start': match.start(),
                    'match_end': match.end(),
                })
                seen_spans.add(span)
        return candidates

    def _normalize_unit(self, unit_raw: str) -> str:
        unit_lower = unit_raw.lower().strip()
        return UNIT_NORMALIZATION.get(unit_lower, unit_raw)

    @staticmethod
    def canonicalize_unit(unit: str, metric: str, value: float) -> Tuple[str, float]:
        if not unit or unit == 'UNKNOWN':
            return unit, value
        if unit == 'kg' and metric in KG_TO_TONNE_METRICS:
            return 'tCO2e', round(value / 1000.0, 6)
        if unit in ('liters', 'litres'):
            return 'KL', round(value / 1000.0, 6)
        canonical = CANONICAL_UNIT.get(unit, unit)
        return canonical, value

    def _is_valid_unit(self, unit: str) -> bool:
        return unit in VALID_UNITS

    def _spans_overlap(self, span1: Tuple[int, int], span2: Tuple[int, int]) -> bool:
        return not (span1[1] <= span2[0] or span2[1] <= span1[0])


# ============================================================================
# LAYER 11: VALIDATION
# ============================================================================

class MetricValidator:
    def __init__(self):
        self.value_ranges = {
            'SCOPE_1': (0, 10_000_000),
            'SCOPE_2': (0, 10_000_000),
            'SCOPE_3': (0, 50_000_000),
            # M-8: widened for GJ-scale reports (FIX 50)
            'ENERGY_CONSUMPTION': (0, 100_000_000_000),
            'WATER_USAGE': (0, 100_000_000),
            'WASTE_GENERATED': (0, 10_000_000),
            'GENDER_DIVERSITY': (0, 100),
            'SAFETY_INCIDENTS': (0, 100_000),
            'EMPLOYEE_WELLBEING': (0, 100),
            'DATA_BREACHES': (0, 100_000),
            # M-9: widened to accept large customer complaint counts (FIX 54)
            'COMPLAINTS': (0, 10_000_000),
        }

    def validate(self, metric: str, value: float, unit: str,
                 context: str, entity_text: str) -> Tuple[str, List[str], float]:
        issues = []
        status = "VALID"
        penalty = 1.0

        if metric in self.value_ranges:
            min_val, max_val = self.value_ranges[metric]
            if value < min_val:
                issues.append(f"Value {value} below minimum {min_val}")
                status = "INVALID"
                penalty *= 0.5
            if value > max_val:
                issues.append(f"Value {value} above maximum {max_val}")
                status = "INVALID"
                penalty *= 0.5

        if metric in STRICT_UNIT_MAP:
            valid_units_for_metric = STRICT_UNIT_MAP[metric]
            if valid_units_for_metric and unit and unit != 'UNKNOWN':
                if unit not in valid_units_for_metric:
                    issues.append(f"Unit '{unit}' incompatible with metric '{metric}'")
                    status = "INVALID"
                    penalty = 0.0

        if not unit:
            if metric not in UNITLESS_ALLOWED_METRICS:
                issues.append(f"Missing unit for metric '{metric}'")
                status = "INVALID"
                penalty = 0.0
        elif unit == 'UNKNOWN':
            if metric not in UNITLESS_ALLOWED_METRICS:
                issues.append(f"Unit unknown for metric '{metric}' — proceeding with penalty")
                if status == "VALID":
                    status = "WARNING"
                penalty *= 0.6

        keyword_penalty = self._check_metric_keywords(metric, context, entity_text)
        if keyword_penalty < 1.0:
            if keyword_penalty == 0.0:
                issues.append(f"No domain keywords found for metric '{metric}'")
                status = "INVALID"
            else:
                issues.append(f"Weak keyword match for metric '{metric}'")
                if status == "VALID":
                    status = "WARNING"
            penalty *= keyword_penalty

        return status, issues, penalty

    def _check_metric_keywords(self, metric: str, context: str, entity_text: str) -> float:
        if metric not in METRIC_KEYWORDS:
            return 1.0
        required_keywords = METRIC_KEYWORDS[metric]
        combined_text = f"{entity_text} {context}".lower()
        matches = sum(1 for kw in required_keywords if kw in combined_text)
        if matches >= 2:
            return 1.0
        elif matches == 1:
            return 0.7
        return 0.0


# ============================================================================
# LAYER 10: CONFIDENCE SCORING
# ============================================================================

class ConfidenceScorer:
    def calculate(self, ner_confidence: float, classification_confidence: float,
                  value_confidence: float, unit: str, entity_text: str,
                  num_value_candidates: int, validation_penalty: float,
                  keyword_match: bool = True, metric: str = "",
                  source_type: str = "paragraph") -> float:
        base_score = (
            ner_confidence * 0.4 +
            classification_confidence * 0.3 +
            value_confidence * 0.3
        )
        if not unit:
            base_score *= 0.7
        base_score *= validation_penalty
        if num_value_candidates > 1:
            base_score *= 0.6
        if len(entity_text.strip()) < 3:
            base_score *= 0.6
        if entity_text.strip().lower() in GENERIC_ENTITY_WORDS:
            base_score *= 0.7
        if not keyword_match:
            base_score *= 0.5
        if source_type == 'paragraph':
            base_score = min(base_score, CONFIDENCE_PARAGRAPH_MAX)
        elif source_type == 'annexure':
            base_score = 0.97   # FIX 56: annexure always gets max confidence
        elif source_type == 'table':
            base_score = max(base_score, 0.5)
        confidence = max(0.1, min(0.97, base_score))
        return round(confidence, 4)


# ============================================================================
# HELPER: Zero-incident context detection
# ============================================================================

_ZERO_INCIDENT_RE = re.compile(
    r'\b(no\s+incidents?|zero\s+(breach|incident|complaint)|nil\s+incident|'
    r'no\s+data\s+breach|no\s+breach|0\s+incidents?)\b',
    re.IGNORECASE,
)


def _matches_zero_incidents(text: str) -> bool:
    return bool(_ZERO_INCIDENT_RE.search(text))


# ============================================================================
# METRIC SELECTION & PRIORITY SYSTEM
# ============================================================================

class MetricSelector:
    @staticmethod
    def compute_final_score(metric: Dict) -> float:
        source_weight = SOURCE_PRIORITY.get(metric.get('source_type', ''), 0.5)
        confidence = metric.get('confidence', 0.0)
        valid_bonus = 1.0 if metric.get('validation_status') == 'VALID' else 0.0
        return (
            source_weight * 0.5 +
            confidence    * 0.4 +
            valid_bonus   * 0.1
        )

    @classmethod
    def _apply_metric_adjustments(cls, candidates: List[Dict]) -> List[Dict]:
        filtered = []
        for m in candidates:
            metric_name = m.get('normalized_metric', '')
            value = m.get('value', 0)
            context = (m.get('context', '') + ' ' + m.get('entity_text', '')).lower()

            if metric_name == 'GENDER_DIVERSITY':
                if value > 100:
                    continue

            elif metric_name == 'SAFETY_INCIDENTS':
                if 'ltifr' in context:
                    m = dict(m)
                    m['confidence'] = max(0.1, m.get('confidence', 0.5) - 0.05)

            elif metric_name == 'DATA_BREACHES':
                if _matches_zero_incidents(context):
                    m = dict(m)
                    m['value'] = 0
                    m['confidence'] = 0.95

            elif metric_name == 'COMPLAINTS':
                if re.search(r'\bper\s+employee\b', context) or re.search(r'\bintensity\b', context):
                    continue

            elif metric_name == 'EMPLOYEE_WELLBEING':
                if value < 0 or value > 100:
                    continue

            filtered.append(m)
        return filtered

    @classmethod
    def _boost_confidence(cls, candidates: List[Dict]) -> List[Dict]:
        boosted = []
        for m in candidates:
            context = (m.get('context', '') + ' ' + m.get('entity_text', '')).lower()
            boost = 0.0
            if 'total' in context or 'overall' in context:
                boost += 0.05
            if _matches_zero_incidents(context):
                boost += 0.10
            if boost > 0:
                m = dict(m)
                m['confidence'] = min(0.99, m.get('confidence', 0.5) + boost)
            boosted.append(m)
        return boosted

    @classmethod
    def select_best(cls, metrics: List[Dict]) -> List[Dict]:
        if not metrics:
            return []
        metrics = cls._apply_metric_adjustments(metrics)
        metrics = cls._boost_confidence(metrics)
        groups: Dict[str, List[Dict]] = defaultdict(list)
        for m in metrics:
            groups[m['normalized_metric']].append(m)
        winners = []
        for metric_name, group in groups.items():
            scored = [(cls.compute_final_score(m), m) for m in group]
            best_score, best = max(scored, key=lambda x: x[0])
            best = dict(best)
            best['_selection_score'] = round(best_score, 4)
            winners.append(best)
        return winners


# ============================================================================
# COMPLETE PIPELINE v11.0 (MERGED)
# ============================================================================

class PDFEvaluationPipeline:
    ALL_TARGET_METRICS = {
        'SCOPE_1', 'SCOPE_2', 'SCOPE_3',
        'ENERGY_CONSUMPTION', 'WATER_USAGE', 'WASTE_GENERATED',
        'GENDER_DIVERSITY', 'SAFETY_INCIDENTS', 'EMPLOYEE_WELLBEING',
        'DATA_BREACHES', 'COMPLAINTS',
    }

    def __init__(self, esg_filter_path: Optional[str] = None,
                 ner_model_path: str = './models/ner_model/final',
                 classifier_path: str = './models/classifier/final'):
        print("\n" + "="*70)
        print("INITIALIZING ESG EXTRACTION PIPELINE v11.0 (MERGED)")
        print("="*70)
        print("\n APPLIED FIXES (v11.0 MERGED — all v9.0 + v10.0 + v11.0 fixes):")
        print("   FIX 33-49: Recovery Mode + Multi-Stage (from v9.0)")
        print("   FIX 50: Energy — Grand-total formula row priority + sub-row filter")
        print("   FIX 51: Waste  — Grand-total formula row priority")
        print("   FIX 52: Scope 1 — All Unicode dash variants in component regex")
        print("   FIX 53: Data Breaches — Page-level nil scan (multi-tier)")
        print("   FIX 54: Complaints — Extended reject + min 1,000 for customer rows")
        print("   FIX 55: Safety Incidents — Cross-contamination guard")
        print("   FIX 56: ANNEXURE SCANNER — Stage 0.5 auditor-verified table scan")
        print("   M-1..9: Merge-only improvements from v9.0 not in v11.0 doc")
        print()

        self.pdf_extractor     = PDFExtractor()
        self.table_parser      = EnhancedTableParser()
        self.preprocessor      = TextPreprocessor()
        self.esg_filter        = ESGCandidateFilter(esg_filter_path)
        self.ner_extractor     = ESGNERExtractor(ner_model_path)
        self.classifier        = MetricClassifier(classifier_path)
        self.value_extractor   = ValueExtractor()
        self.validator         = MetricValidator()
        self.confidence_scorer = ConfidenceScorer()
        self.metric_selector   = MetricSelector()

        print(" Pipeline v11.0 (MERGED) initialized successfully\n")

    def process_pdf(self, pdf_path: str, output_path: Optional[str] = None) -> Dict:
        print("\n" + "="*70)
        print(f"PROCESSING: {pdf_path}")
        print("="*70)

        results = {
            'file':             str(pdf_path),
            'pipeline_version': 'v11.0_merged',
            'metrics':          [],
            'discarded':        [],
            'statistics':       {},
            'warnings':         [],
            'discard_reasons':  defaultdict(int),
        }

        print("\n[Layer 1] Extracting text and tables from PDF...")
        pdf_data = self.pdf_extractor.extract_text_and_tables(pdf_path)

        # ======================================================================
        # STAGE 0.5: ANNEXURE / SUMMARY TABLE SCANNER  (FIX 56)
        # Runs BEFORE Stage 0 so auditor-verified values override body extraction.
        # ======================================================================
        print("\n" + "-"*50)
        print("[STAGE 0.5] Annexure / Summary Table Scanner...")
        print("-"*50)
        annexure_metrics = AnnexureSummaryScanner.extract(pdf_data)
        annexure_metric_names: Set[str] = {m['normalized_metric'] for m in annexure_metrics}
        print(f"    Stage 0.5: {len(annexure_metrics)} metric(s) from annexure "
              f"({len(annexure_metric_names)} unique)")

        # ======================================================================
        # STAGE 0: TABLE RECONSTRUCTION (PRIMARY)
        # ======================================================================
        print("\n" + "-"*50)
        print("[STAGE 0] Table reconstruction + structured extraction...")
        print("-"*50)
        reconstructed_metrics = TableReconstructor.extract_from_pdf(pdf_data)
        print(f"    Stage 0: {len(reconstructed_metrics)} metric(s) extracted via reconstruction")

        # Annexure takes priority over Stage 0 for overlapping metrics
        stage0_filtered = [
            m for m in reconstructed_metrics
            if m['normalized_metric'] not in annexure_metric_names
        ]
        combined_pre_s1 = annexure_metrics + stage0_filtered

        found_pre_s1 = {m['normalized_metric'] for m in combined_pre_s1}
        missing_pre_s1 = self.ALL_TARGET_METRICS - found_pre_s1

        print(f"    After Stage 0.5+0: {len(found_pre_s1)} unique metrics found. "
              f"Missing: {missing_pre_s1 if missing_pre_s1 else 'none'}")

        if len(found_pre_s1) >= 4:
            print(f"   Stage 0.5+0 sufficient. Skipping legacy table parsers.")
            table_metrics = combined_pre_s1
        else:
            print(f"\n     Running legacy table parsers for missing metrics...")

            # STAGE 1: Strict table extraction
            print("\n" + "-"*50)
            print("[STAGE 1] Strict table extraction (total rows only)...")
            print("-"*50)
            table_metrics_stage1 = EnhancedTableParser.parse_tables(
                pdf_data.get('tables', []),
                page_texts=pdf_data.get('pages', []),
                relaxed=False
            )
            print(f"    Stage 1: {len(table_metrics_stage1)} metric(s) extracted")

            combined_s0_s1 = list(combined_pre_s1)
            existing_names = {m['normalized_metric'] for m in combined_pre_s1}
            for m in table_metrics_stage1:
                if m['normalized_metric'] not in existing_names:
                    combined_s0_s1.append(m)

            found_after_s1 = {m['normalized_metric'] for m in combined_s0_s1}

            if len(found_after_s1) >= 4:
                print(f"   Stage 0.5+0+1 sufficient. Skipping Stage 2.")
                table_metrics = combined_s0_s1
            else:
                missing_after_s1 = self.ALL_TARGET_METRICS - found_after_s1
                print(f"\n     Stage 0.5+0+1 found {len(found_after_s1)} metrics. "
                      f"Missing: {missing_after_s1}")
                print("\n" + "-"*50)
                print("[STAGE 2] Relaxed table extraction...")
                print("-"*50)
                table_metrics_stage2 = EnhancedTableParser.parse_tables(
                    pdf_data.get('tables', []),
                    page_texts=pdf_data.get('pages', []),
                    relaxed=True
                )
                print(f"    Stage 2: {len(table_metrics_stage2)} metric(s) extracted")

                table_metrics = list(combined_s0_s1)
                s0_s1_names = {m['normalized_metric'] for m in combined_s0_s1}
                for m in table_metrics_stage2:
                    if m['normalized_metric'] not in s0_s1_names:
                        table_metrics.append(m)
                print(f"    Combined table metrics (S0.5+S0+S1+S2): {len(table_metrics)}")

        table_metric_names: Set[str] = {m['normalized_metric'] for m in table_metrics}

        print("\n[Layer 2-3] Preprocessing and chunking text...")
        clean_text = self.preprocessor.clean_text(pdf_data['full_text'])
        chunks = self.preprocessor.chunk_text(clean_text)
        print(f"    Created {len(chunks)} text chunks")

        print("[Layer 4] Filtering ESG candidates...")
        esg_chunks = []
        for chunk in chunks:
            is_esg, conf = self.esg_filter.is_esg_candidate(chunk['text'])
            if is_esg:
                chunk['esg_confidence'] = conf
                esg_chunks.append(chunk)
        esg_pct = len(esg_chunks) / len(chunks) * 100 if chunks else 0
        print(f"    {len(esg_chunks)}/{len(chunks)} ESG chunks ({esg_pct:.1f}%)")

        table_override_active = len(table_metrics) > 0
        table_unique_metrics = {m['normalized_metric'] for m in table_metrics}
        need_stage3 = len(table_unique_metrics) < 3

        if len(table_metrics) == 0:
            print("\n   [FIX 41/44] No table metrics found — ENABLING full paragraph extraction")
            table_override_active = False
            need_stage3 = True
        elif need_stage3:
            print(f"\n   [STAGE 3 TRIGGER] Only {len(table_unique_metrics)} unique table metrics (<3) — "
                  f"enabling text fallback for missing metrics")
        else:
            print(f"  Table override active for: {table_metric_names}")
            missing_after_table = self.ALL_TARGET_METRICS - table_unique_metrics
            if missing_after_table:
                need_stage3 = True
                print(f"  Still missing {len(missing_after_table)} target metrics: {missing_after_table}")
                print(f"    Stage 3 enabled for missing metrics only")

        text_metrics: List[Dict] = []
        all_discarded: List[Dict] = []

        if need_stage3:
            print("\n" + "-"*50)
            print("[STAGE 3] Smart text fallback (paragraph extraction)...")
            print("-"*50)

            for chunk_idx, chunk in enumerate(esg_chunks):
                if PARAGRAPH_REJECT_KEYWORDS.search(chunk['text']):
                    all_discarded.append({
                        'entity_text': chunk['text'][:100],
                        'reason': 'paragraph_reject_keyword',
                        'chunk_idx': chunk_idx,
                    })
                    results['discard_reasons']['paragraph_reject_keyword'] += 1
                    continue

                entities = self.ner_extractor.extract_entities(chunk['text'], chunk['section_type'])
                if not entities:
                    continue

                for entity in entities:
                    metric_result, discard_reason = self._process_entity(entity, chunk)
                    if discard_reason:
                        results['discard_reasons'][discard_reason] += 1
                        all_discarded.append({
                            'entity_text': entity['text'],
                            'reason': discard_reason,
                            'chunk_idx': chunk_idx,
                        })
                    elif metric_result:
                        if table_override_active and metric_result['normalized_metric'] in table_metric_names:
                            continue
                        text_metrics.append(metric_result)
        else:
            print("\n   Sufficient table metrics. Stage 3 text fallback skipped.")

        print(f"\n[Pre-dedup] Table: {len(table_metrics)}, Text: {len(text_metrics)}, "
              f"Discarded: {len(all_discarded)}")

        if results['discard_reasons']:
            print("\n[Discard Breakdown]")
            for reason, count in sorted(results['discard_reasons'].items(), key=lambda x: -x[1]):
                print(f"  - {reason}: {count}")

        all_metrics = table_metrics + text_metrics

        # ======================================================================
        # STAGE 4: EXTENDED METRIC EXTRACTION (Plugin)
        # ======================================================================
        print("\n" + "-"*50)
        print("[STAGE 4] Extended metric extraction (social/governance)...")
        print("-"*50)
        from metric_extensions import run_extended_extraction
        extended_metrics = run_extended_extraction(pdf_data, all_metrics)

        # M-5: Full Stage-4 cross-contamination guard (from v9.0)
        # Reject extension results that duplicate or contaminate earlier stages.
        already_found = {m['normalized_metric'] for m in all_metrics}
        data_breach_values = {
            m['value'] for m in all_metrics
            if m['normalized_metric'] == 'DATA_BREACHES'
        }
        complaints_values = {
            m['value'] for m in all_metrics
            if m['normalized_metric'] == 'COMPLAINTS'
        }

        filtered_extended = []
        for em in extended_metrics:
            metric_name = em['normalized_metric']
            if metric_name in already_found:
                print(f"    [Stage4-filter] Skipping {metric_name} — already found in earlier stage")
                continue
            # FIX 55 guard at Stage 4 level: discard SAFETY_INCIDENTS if value
            # matches a known DATA_BREACHES or COMPLAINTS value
            if metric_name == 'SAFETY_INCIDENTS':
                if em['value'] in data_breach_values or em['value'] in complaints_values:
                    print(f"    [Stage4-filter] Discarding SAFETY_INCIDENTS value {em['value']} "
                          f"— matches DATA_BREACHES or COMPLAINTS (cross-contamination)")
                    continue
            filtered_extended.append(em)

        all_metrics = all_metrics + filtered_extended

        results['metrics'] = self.metric_selector.select_best(all_metrics)
        results['metrics'].sort(key=lambda x: x.get('_selection_score', 0), reverse=True)
        results['discarded'] = all_discarded

        before_conf = len(results['metrics'])
        results['metrics'] = [m for m in results['metrics'] if m['confidence'] >= 0.5]
        discarded_low_conf = before_conf - len(results['metrics'])
        if discarded_low_conf > 0:
            print(f"\n[Conf gate] Discarded {discarded_low_conf} metrics with confidence < 0.5")

        final_metric_names = {m['normalized_metric'] for m in results['metrics']}
        still_missing = self.ALL_TARGET_METRICS - final_metric_names
        print(f"\n[Completeness] Found: {len(final_metric_names)}/11 target metrics")
        if still_missing:
            print(f"     Still missing: {still_missing}")
        else:
            print(f"   All target metrics recovered!")

        print(f"[Final] {len(results['metrics'])} unique metrics")

        valid_metrics = [m for m in results['metrics'] if m['validation_status'] == 'VALID']
        confidences = [m['confidence'] for m in results['metrics']]
        results['statistics'] = {
            'total_chunks':             len(chunks),
            'esg_chunks':               len(esg_chunks),
            'esg_chunk_percentage':     round(esg_pct, 2),
            'table_extractions':        len(table_metrics),
            'text_extractions':         len(text_metrics),
            'discarded_extractions':    len(all_discarded),
            'discarded_low_confidence': discarded_low_conf,
            'final_metrics':            len(results['metrics']),
            'valid_metrics':            len(valid_metrics),
            'missing_metrics':          list(still_missing),
            'avg_confidence':  round(float(np.mean(confidences)), 4) if confidences else 0,
            'min_confidence':  round(float(np.min(confidences)), 4) if confidences else 0,
            'max_confidence':  round(float(np.max(confidences)), 4) if confidences else 0,
        }

        for metric in results['metrics']:
            if metric['validation_status'] != 'VALID':
                results['warnings'].append({
                    'metric': metric['normalized_metric'],
                    'issues': metric['validation_issues'],
                })

        mp_json = self._build_master_prompt_json(results['metrics'])
        results['master_prompt_output'] = mp_json

        if output_path:
            with open(output_path, 'w') as f:
                json.dump(results, f, indent=2)
            print(f"\n   Results saved to {output_path}")
            mp_path = output_path.replace('.json', '_mp_output.json')
            with open(mp_path, 'w') as f:
                json.dump(mp_json, f, indent=2)
            print(f"   Master-prompt JSON saved to {mp_path}")

        self._print_summary(results)
        return results

    def _process_entity(self, entity: Dict, chunk: Dict) -> Tuple[Optional[Dict], Optional[str]]:
        context = self.value_extractor.extract_context(chunk['text'], entity['start'], entity['end'])
        normalized_metric, class_conf = self.classifier.classify(
            entity['text'], context, entity['section_type']
        )
        if normalized_metric == "UNKNOWN":
            return None, "unknown_metric_classification"

        entity_text_in_context = entity['text']
        entity_pos_in_context = context.find(entity_text_in_context)
        if entity_pos_in_context >= 0:
            ent_start_ctx = entity_pos_in_context
            ent_end_ctx = entity_pos_in_context + len(entity_text_in_context)
        else:
            ent_start_ctx = None
            ent_end_ctx = None

        value_data = self.value_extractor.extract_value(
            context,
            entity_start_in_context=ent_start_ctx,
            entity_end_in_context=ent_end_ctx,
            classifier_confidence=class_conf,
        )
        if not value_data:
            return None, "no_valid_value_after_hard_filtering"

        canonical_unit, canonical_value = ValueExtractor.canonicalize_unit(
            value_data['unit'], normalized_metric, value_data['value']
        )
        value_data['unit'] = canonical_unit
        value_data['value'] = canonical_value

        min_val = MIN_VALUES.get(normalized_metric, 0)
        if canonical_value < min_val:
            return None, f"value_below_min_{min_val}"

        if normalized_metric in STRICT_UNIT_MAP and STRICT_UNIT_MAP[normalized_metric]:
            if canonical_unit and canonical_unit != 'UNKNOWN' and canonical_unit not in STRICT_UNIT_MAP[normalized_metric]:
                return None, f"invalid_unit_{canonical_unit}_for_{normalized_metric}"

        source_type = 'paragraph'
        validation_status, validation_issues, validation_penalty = self.validator.validate(
            metric=normalized_metric,
            value=canonical_value,
            unit=canonical_unit,
            context=context,
            entity_text=entity['text'],
        )
        if validation_penalty == 0.0:
            return None, f"validation_discard: {'; '.join(validation_issues)}"

        keyword_match = True
        if normalized_metric in METRIC_KEYWORDS:
            combined = f"{entity['text']} {context}".lower()
            keyword_match = any(kw in combined for kw in METRIC_KEYWORDS[normalized_metric])

        confidence = self.confidence_scorer.calculate(
            ner_confidence=entity['confidence'],
            classification_confidence=class_conf,
            value_confidence=value_data['confidence'],
            unit=canonical_unit,
            entity_text=entity['text'],
            num_value_candidates=value_data.get('num_candidates', 1),
            validation_penalty=validation_penalty,
            keyword_match=keyword_match,
            metric=normalized_metric,
            source_type=source_type,
        )

        return {
            'entity_text':        entity['text'],
            'normalized_metric':  normalized_metric,
            'value':              canonical_value,
            'unit':               canonical_unit,
            'context':            context[:200],
            'section_type':       entity['section_type'],
            'confidence':         confidence,
            'validation_status':  validation_status,
            'validation_issues':  validation_issues,
            'source_type':        source_type,
        }, None

    @staticmethod
    def _confidence_band(conf: float) -> str:
        if conf >= 0.9:  return "high (0.9-1.0)"
        if conf >= 0.7:  return "good (0.7-0.8)"
        if conf >= 0.5:  return "weak (0.5-0.6)"
        return "discard (<0.5)"

    @staticmethod
    def _build_master_prompt_json(metrics: List[Dict]) -> Dict:
        output: Dict = {}
        for m in metrics:
            output[m['normalized_metric']] = {
                'value':           m['value'],
                'unit':            m.get('unit', ''),
                'confidence':      m['confidence'],
                'confidence_band': PDFEvaluationPipeline._confidence_band(m['confidence']),
                'source':          m.get('source_type', 'text'),
                'page':            m.get('page', None),
            }
        return output

    def _print_summary(self, results: Dict):
        """M-4: Richer summary with Target Achievements + Top 5 Metrics (from v9.0)."""
        print("\n" + "="*70)
        print("EXTRACTION SUMMARY (v11.0 MERGED — Annexure Scanner + All Fixes)")
        print("="*70)

        stats = results['statistics']

        print(f"\n   Overall Statistics:")
        print(f"  Total chunks: {stats['total_chunks']}")
        print(f"  ESG chunks: {stats['esg_chunks']} ({stats['esg_chunk_percentage']}%)")
        print(f"  Table extractions: {stats['table_extractions']}")
        print(f"  Text extractions: {stats['text_extractions']}")
        print(f"  Discarded: {stats['discarded_extractions']}")
        print(f"  Discarded (low confidence): {stats['discarded_low_confidence']}")
        print(f"  Final unique metrics: {stats['final_metrics']}")
        print(f"  Valid metrics: {stats['valid_metrics']}")

        print(f"\n Confidence Statistics:")
        print(f"  Average: {stats['avg_confidence']:.4f}")
        print(f"  Min: {stats['min_confidence']:.4f}")
        print(f"  Max: {stats['max_confidence']:.4f}")

        print(f"\n Target Achievements:")
        if 70 <= stats['esg_chunk_percentage'] <= 85:
            print(f"     ESG chunk rate in target range (70-85%): {stats['esg_chunk_percentage']:.1f}%")
        else:
            print(f"     ESG chunk rate outside target: {stats['esg_chunk_percentage']:.1f}% (target: 70-85%)")
        if 0.55 <= stats['avg_confidence'] <= 0.75:
            print(f"     Avg confidence in target range (55-75%): {stats['avg_confidence']:.2%}")
        else:
            print(f"     Avg confidence outside target: {stats['avg_confidence']:.2%} (target: 55-75%)")

        print(f"\n Extracted Metrics:")
        if results['metrics']:
            for m in sorted(results['metrics'], key=lambda x: x['normalized_metric']):
                print(f"  - {m['normalized_metric']}: {m['value']} {m.get('unit','')} "
                      f"(conf: {m['confidence']:.4f}, src: {m.get('source_type','?')}, "
                      f"page: {m.get('page','?')})")

            print(f"\n Top 5 Metrics (by confidence):")
            sorted_by_conf = sorted(results['metrics'], key=lambda x: x['confidence'], reverse=True)
            for i, m in enumerate(sorted_by_conf[:5], 1):
                print(f"  {i}. {m['normalized_metric']}: {m['value']} {m.get('unit', '')} "
                      f"(conf: {m['confidence']:.4f})")
        else:
            print("  (No metrics extracted)")

        if results['warnings']:
            print(f"\n  Warnings: {len(results['warnings'])}")
            for w in results['warnings'][:5]:
                print(f"  - {w['metric']}: {', '.join(w['issues'][:2])}")

        print("\n" + "="*70)


# ============================================================================
# MAIN
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description='ESG PDF Extraction v11.0 (Merged — All Fixes)')
    parser.add_argument('--pdf_path', type=str, required=True, help='Path to PDF file')
    parser.add_argument('--output_path', type=str, default='results_v11.0_merged.json',
                        help='Output JSON path')
    parser.add_argument('--ner_model', type=str, default='./models/ner_model/final',
                        help='NER model path')
    parser.add_argument('--classifier', type=str, default='./models/classifier/final',
                        help='Classifier model path')
    parser.add_argument('--esg_filter', type=str, default=None,
                        help='ESG filter model path (optional)')
    args = parser.parse_args()

    pipeline = PDFEvaluationPipeline(
        esg_filter_path=args.esg_filter,
        ner_model_path=args.ner_model,
        classifier_path=args.classifier
    )
    results = pipeline.process_pdf(args.pdf_path, args.output_path)
    print(f"\n Processing complete! Results: {args.output_path}")


if __name__ == "__main__":
    main()
