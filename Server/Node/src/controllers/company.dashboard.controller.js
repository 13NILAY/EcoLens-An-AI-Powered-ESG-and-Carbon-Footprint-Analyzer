const pool = require("../config/db");

const getCompanyId = async (userId) => {
  const result = await pool.query(
    "SELECT id FROM companies WHERE user_id = $1",
    [userId]
  );
  return result.rows[0]?.id;
};

// 📌 Summary Cards
const getDashboardSummary = async (req, res) => {
  try {
    const companyId = await getCompanyId(req.user.userId);

    const result = await pool.query(
      `SELECT 
        COUNT(r.id) AS total_reports,
        MAX(e.overall_score) AS latest_esg_score,
        MAX(e.grade) AS latest_grade
       FROM reports r
       LEFT JOIN esg_scores e ON r.id = e.report_id
       WHERE r.company_id = $1`,
      [companyId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Dashboard summary failed" });
  }
};

// 📈 ESG Trend
const getEsgTrend = async (req, res) => {
  try {
    const companyId = await getCompanyId(req.user.userId);

    const result = await pool.query(
      `SELECT e.overall_score, e.created_at
       FROM esg_scores e
       JOIN reports r ON e.report_id = r.id
       WHERE r.company_id = $1
       ORDER BY e.created_at`,
      [companyId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "ESG trend failed" });
  }
};

// 🌍 Emissions
const getEmissions = async (req, res) => {
  try {
    const companyId = await getCompanyId(req.user.userId);

    const result = await pool.query(
      `SELECT metric_name, SUM(metric_value) AS total
       FROM esg_metrics
       JOIN reports ON esg_metrics.report_id = reports.id
       WHERE reports.company_id = $1
       AND metric_name IN ('scope1','scope2','scope3')
       GROUP BY metric_name`,
      [companyId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Emissions data failed" });
  }
};

module.exports = {
  getDashboardSummary,
  getEsgTrend,
  getEmissions
};
