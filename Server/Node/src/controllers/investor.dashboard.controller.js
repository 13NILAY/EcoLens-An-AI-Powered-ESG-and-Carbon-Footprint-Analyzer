const pool = require("../config/db");

// 1. Company ESG Rankings (Table)
const getCompanies = async (req, res) => {
  try {
    const { industry, minScore = 0, maxScore = 100, search = "" } = req.query;

    let query = `
      SELECT 
        c.id,
        c.name,
        c.industry,
        es.overall_score AS esg_score,
        es.environmental,
        es.social,
        es.governance
      FROM companies c
      JOIN reports r ON r.company_id = c.id
      JOIN esg_scores es ON es.report_id = r.id
      WHERE es.overall_score BETWEEN $1 AND $2
    `;

    const values = [minScore, maxScore];

    if (industry && industry !== "all") {
      values.push(industry);
      query += ` AND c.industry = $${values.length}`;
    }

    if (search) {
      values.push(`%${search}%`);
      query += ` AND c.name ILIKE $${values.length}`;
    }

    query += ` ORDER BY es.overall_score DESC`;

    const result = await pool.query(query, values);
    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch companies" });
  }
};

// 2. Dashboard Summary Cards
const getDashboardSummary = async (req, res) => {
  try {
    const avgResult = await pool.query(`
      SELECT ROUND(AVG(overall_score), 1) AS avg_esg
      FROM esg_scores
    `);

    const topResult = await pool.query(`
      SELECT c.name, es.overall_score
      FROM companies c
      JOIN reports r ON r.company_id = c.id
      JOIN esg_scores es ON es.report_id = r.id
      ORDER BY es.overall_score DESC
      LIMIT 1
    `);

    const riskResult = await pool.query(`
      SELECT COUNT(*) AS risky
      FROM esg_scores
      WHERE overall_score < 50
    `);

    const companyCount = await pool.query(
      `SELECT COUNT(*) FROM companies`
    );

    res.json({
      avgEsgScore: avgResult.rows[0].avg_esg,
      topPerformer: topResult.rows[0],
      riskCount: Number(riskResult.rows[0].risky),
      totalCompanies: Number(companyCount.rows[0].count)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load dashboard summary" });
  }
};

// 3. Industry ESG Performance
const getIndustryPerformance = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        industry,
        ROUND(AVG(es.overall_score), 1) AS avg_score
      FROM companies c
      JOIN reports r ON r.company_id = c.id
      JOIN esg_scores es ON es.report_id = r.id
      GROUP BY industry
      ORDER BY avg_score DESC
    `);

    const formatted = result.rows.map(row => ({
      industry: row.industry,
      avgScore: row.avg_score,
      trend: row.avg_score >= 70 ? "up" : row.avg_score >= 55 ? "stable" : "down"
    }));

    res.json(formatted);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch industry data" });
  }
};

// 4. ESG vs Sentiment Trend (TEMPORARY)
const getEsgSentimentTrend = async (req, res) => {
  res.json([
    { month: "Jul", esg: 72, sentiment: 65 },
    { month: "Aug", esg: 74, sentiment: 68 },
    { month: "Sep", esg: 76, sentiment: 70 },
    { month: "Oct", esg: 75, sentiment: 72 },
    { month: "Nov", esg: 78, sentiment: 74 },
    { month: "Dec", esg: 80, sentiment: 76 },
    { month: "Jan", esg: 82, sentiment: 78 }
  ]);
};

module.exports = {
  getCompanies,
  getDashboardSummary,
  getIndustryPerformance,
  getEsgSentimentTrend
};
