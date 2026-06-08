const pool = require("../config/db");

/* -----------------------------------
   API 1: Company list for dropdowns
----------------------------------- */
const getCompanyList = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        industry
      FROM companies
      WHERE id IS NOT NULL AND name IS NOT NULL
      ORDER BY name ASC
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: "No companies found",
        data: []
      });
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching company list:", error);
    res.status(500).json({ message: "Failed to fetch company list", error: error.message });
  }
};

/* -----------------------------------
   Helper: derive data-driven insights
----------------------------------- */
const scoreLabel = (score) => {
  if (score >= 85) return "excellent";
  if (score >= 70) return "strong";
  if (score >= 55) return "moderate";
  if (score >= 40) return "weak";
  return "critical";
};

const deriveInsights = (scores, peerScores = null) => {
  const strengths = [];
  const weaknesses = [];
  const { environmental: E, social: S, governance: G, overall_score: overall } = scores;

  // --- Absolute strengths ---
  if (E >= 80) strengths.push(`Environmental score of ${E} — ${scoreLabel(E)} sustainability practices`);
  if (S >= 80) strengths.push(`Social score of ${S} — ${scoreLabel(S)} workforce and community engagement`);
  if (G >= 80) strengths.push(`Governance score of ${G} — ${scoreLabel(G)} board and transparency standards`);

  // Highest pillar callout
  const pillars = [
    { key: "Environmental", val: E },
    { key: "Social", val: S },
    { key: "Governance", val: G }
  ].sort((a, b) => b.val - a.val);
  const top = pillars[0];
  const bottom = pillars[pillars.length - 1];
  if (top.val >= 65 && top.val > bottom.val + 10) {
    strengths.push(`${top.key} is the leading pillar at ${top.val} — above-average for this company`);
  }
  if (overall >= 70) {
    strengths.push(`Overall ESG score of ${overall} places this company in the ${scoreLabel(overall)} tier`);
  }

  // --- Absolute weaknesses ---
  if (E < 60) weaknesses.push(`Environmental score of ${E} (${scoreLabel(E)}) — carbon and resource practices need attention`);
  if (S < 60) weaknesses.push(`Social score of ${S} (${scoreLabel(S)}) — labor, DEI, or community policies require improvement`);
  if (G < 60) weaknesses.push(`Governance score of ${G} (${scoreLabel(G)}) — transparency and board oversight gaps`);

  // Lowest pillar callout
  if (bottom.val < 75 && bottom.val < top.val - 10) {
    weaknesses.push(`${bottom.key} is the weakest pillar at ${bottom.val} — primary area for targeted improvement`);
  }
  if (overall < 55) {
    weaknesses.push(`Overall ESG score of ${overall} is below the ${scoreLabel(overall)} threshold — significant ESG risk`);
  }

  // --- Cross-company relative insights (optional) ---
  if (peerScores) {
    const peerE = peerScores.environmental;
    const peerS = peerScores.social;
    const peerG = peerScores.governance;
    if (E - peerE >= 10) strengths.push(`Environmental score is ${E - peerE} points ahead of peer company`);
    if (S - peerS >= 10) strengths.push(`Social score is ${S - peerS} points ahead of peer company`);
    if (G - peerG >= 10) strengths.push(`Governance score is ${G - peerG} points ahead of peer company`);
    if (peerE - E >= 10) weaknesses.push(`Environmental score lags peer by ${peerE - E} points — key catch-up opportunity`);
    if (peerS - S >= 10) weaknesses.push(`Social score lags peer by ${peerS - S} points — key catch-up opportunity`);
    if (peerG - G >= 10) weaknesses.push(`Governance score lags peer by ${peerG - G} points — key catch-up opportunity`);
  }

  if (strengths.length === 0) strengths.push(`Overall score of ${overall} meets baseline ESG standards`);
  if (weaknesses.length === 0) weaknesses.push("No significant ESG concerns identified across all pillars");

  return { strengths, weaknesses };
};

/* -----------------------------------
   API 2: Compare two companies
----------------------------------- */
const compareCompanies = async (req, res) => {
  try {
    const { company1, company2 } = req.query;

    // Validate inputs
    if (!company1 || !company2) {
      return res.status(400).json({ 
        message: "Both company IDs or names are required",
        required: ['company1', 'company2']
      });
    }

    if (String(company1) === String(company2)) {
      return res.status(400).json({ 
        message: "Cannot compare the same company with itself"
      });
    }

    const query = `
      SELECT 
        c.id,
        c.name,
        c.industry,
        c.market_cap,
        es.overall_score,
        es.environmental,
        es.social,
        es.governance
      FROM companies c
      JOIN reports r ON r.company_id = c.id
      JOIN esg_scores es ON es.report_id = r.id
      WHERE (c.id::text = $1 OR LOWER(c.name) = LOWER($1))
      ORDER BY r.created_at DESC
      LIMIT 1
    `;

    const c1 = await pool.query(query, [company1]);
    const c2 = await pool.query(query, [company2]);

    if (c1.rows.length === 0 || c2.rows.length === 0) {
      return res.status(404).json({ 
        message: "One or both companies not found in database",
        found: {
          company1: c1.rows.length > 0,
          company2: c2.rows.length > 0
        }
      });
    }

    const company1Data = c1.rows[0];
    const company2Data = c2.rows[0];

    const insights1 = deriveInsights(company1Data, company2Data);
    const insights2 = deriveInsights(company2Data, company1Data);

    res.json({
      company1: {
        id: company1Data.id,
        name: company1Data.name,
        industry: company1Data.industry,
        marketCap: company1Data.market_cap,
        esgScore: parseFloat(company1Data.overall_score) ?? null,
        environmental: { score: parseFloat(company1Data.environmental) ?? null },
        social: { score: parseFloat(company1Data.social) ?? null },
        governance: { score: parseFloat(company1Data.governance) ?? null },
        strengths: insights1.strengths,
        weaknesses: insights1.weaknesses
      },
      company2: {
        id: company2Data.id,
        name: company2Data.name,
        industry: company2Data.industry,
        marketCap: company2Data.market_cap,
        esgScore: parseFloat(company2Data.overall_score) ?? null,
        environmental: { score: parseFloat(company2Data.environmental) ?? null },
        social: { score: parseFloat(company2Data.social) ?? null },
        governance: { score: parseFloat(company2Data.governance) ?? null },
        strengths: insights2.strengths,
        weaknesses: insights2.weaknesses
      },
      lastUpdated: new Date()
    });

  } catch (error) {
    console.error("Comparison error:", error);
    res.status(500).json({ message: "Comparison failed", error: error.message });
  }
};

module.exports = {
  getCompanyList,
  compareCompanies
};
