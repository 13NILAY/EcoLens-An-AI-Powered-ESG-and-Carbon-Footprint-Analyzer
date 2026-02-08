const pool = require("../config/db");

/* -----------------------------------
   API 1: Company list for dropdowns
----------------------------------- */
const getCompanyList = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, industry
      FROM companies
      ORDER BY name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch company list" });
  }
};

/* -----------------------------------
   Helper: derive strengths & weaknesses
----------------------------------- */
const deriveInsights = (scores) => {
  const strengths = [];
  const weaknesses = [];

  if (scores.environmental >= 80) strengths.push("Strong environmental performance");
  if (scores.social >= 80) strengths.push("Strong social initiatives");
  if (scores.governance >= 80) strengths.push("Strong governance structure");

  if (scores.environmental < 60) weaknesses.push("Environmental impact needs improvement");
  if (scores.social < 60) weaknesses.push("Social practices need improvement");
  if (scores.governance < 60) weaknesses.push("Governance concerns");

  return { strengths, weaknesses };
};

/* -----------------------------------
   API 2: Compare two companies
----------------------------------- */
const compareCompanies = async (req, res) => {
  try {
    const { company1, company2 } = req.query;

    if (!company1 || !company2) {
      return res.status(400).json({ message: "Both company IDs are required" });
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
      WHERE c.id = $1
      ORDER BY r.created_at DESC
      LIMIT 1
    `;

    const c1 = await pool.query(query, [company1]);
    const c2 = await pool.query(query, [company2]);

    if (c1.rows.length === 0 || c2.rows.length === 0) {
      return res.status(404).json({ message: "Company data not found" });
    }

    const company1Data = c1.rows[0];
    const company2Data = c2.rows[0];

    const insights1 = deriveInsights(company1Data);
    const insights2 = deriveInsights(company2Data);

    res.json({
      company1: {
        id: company1Data.id,
        name: company1Data.name,
        industry: company1Data.industry,
        marketCap: company1Data.market_cap,
        esgScore: company1Data.overall_score,
        environmental: { score: company1Data.environmental },
        social: { score: company1Data.social },
        governance: { score: company1Data.governance },
        strengths: insights1.strengths,
        weaknesses: insights1.weaknesses
      },
      company2: {
        id: company2Data.id,
        name: company2Data.name,
        industry: company2Data.industry,
        marketCap: company2Data.market_cap,
        esgScore: company2Data.overall_score,
        environmental: { score: company2Data.environmental },
        social: { score: company2Data.social },
        governance: { score: company2Data.governance },
        strengths: insights2.strengths,
        weaknesses: insights2.weaknesses
      },
      lastUpdated: new Date()
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Comparison failed" });
  }
};

module.exports = {
  getCompanyList,
  compareCompanies
};
