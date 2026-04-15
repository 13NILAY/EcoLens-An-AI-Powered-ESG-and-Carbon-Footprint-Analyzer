const pool = require("../config/db");

const getCompanyId = async (userId) => {
  const result = await pool.query(
    "SELECT id FROM companies WHERE user_id = $1",
    [userId]
  );
  return result.rows[0]?.id;
};

/**
 * Convert time range string to a SQL date filter
 * @param {string} range - 1m, 3m, 1y, ytd
 * @returns {string} SQL WHERE clause fragment
 */
const getDateFilter = (range) => {
  switch (range) {
    case '1m':
      return "r.created_at >= NOW() - INTERVAL '1 month'";
    case '3m':
      return "r.created_at >= NOW() - INTERVAL '3 months'";
    case '1y':
      return "r.created_at >= NOW() - INTERVAL '1 year'";
    case 'ytd':
      return "r.created_at >= DATE_TRUNC('year', NOW())";
    default:
      return "r.created_at >= NOW() - INTERVAL '1 year'";
  }
};

// 📌 Summary Cards - Return proper format for frontend
const getDashboardSummary = async (req, res) => {
  try {
    const companyId = await getCompanyId(req.user.userId);

    // Get latest ESG scores
    const esgResult = await pool.query(
      `SELECT 
        e.overall_score,
        e.environmental,
        e.social,
        e.governance,
        r.created_at
       FROM esg_scores e
       JOIN reports r ON e.report_id = r.id
       WHERE r.company_id = $1
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [companyId]
    );

    // Get emissions data
    const emissionsResult = await pool.query(
      `SELECT metric_name, SUM(metric_value) AS total
       FROM esg_metrics em
       JOIN reports r ON em.report_id = r.id
       WHERE r.company_id = $1
       GROUP BY metric_name`,
      [companyId]
    );

    const latestEsg = esgResult.rows[0] || {};
    const emissions = {};
    emissionsResult.rows.forEach(row => {
      emissions[row.metric_name] = parseInt(row.total) || 0;
    });

    // Get real recommendations from latest report
    let recommendations = [];
    if (esgResult.rows.length > 0) {
      const recResult = await pool.query(
        `SELECT title, description, impact, effort 
         FROM ai_recommendations 
         WHERE report_id = (
           SELECT r.id FROM reports r 
           JOIN esg_scores e ON e.report_id = r.id
           WHERE r.company_id = $1 
           ORDER BY r.created_at DESC LIMIT 1
         )`,
        [companyId]
      );
      recommendations = recResult.rows;
    }

    return res.json({
      success: true,
      data: {
        esgScore: latestEsg.overall_score ?? null,
        environmentalScore: latestEsg.environmental ?? null,
        socialScore: latestEsg.social ?? null,
        governanceScore: latestEsg.governance ?? null,
        carbonEmissions: `${(emissions.CARBON_EMISSIONS || 0)} tCO₂`,
        energyConsumption: `${(emissions.ENERGY_CONSUMPTION || 0)} MWh`,
        waterUsage: `${(emissions.WATER_USAGE || 0)} m³`,
        wasteGenerated: `${(emissions.WASTE_GENERATED || 0)} kg`,
        recommendations
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Dashboard summary failed" });
  }
};

// 📈 ESG Trend - Return formatted trend data
const getEsgTrend = async (req, res) => {
  try {
    const companyId = await getCompanyId(req.user.userId);

    const result = await pool.query(
      `SELECT 
        e.overall_score,
        e.created_at,
        r.file_name
       FROM esg_scores e
       JOIN reports r ON e.report_id = r.id
       WHERE r.company_id = $1
       ORDER BY e.created_at DESC
       LIMIT 12`,
      [companyId]
    );

    const data = result.rows.map((row, index) => ({
      month: `Report ${result.rows.length - index}`,
      esg: row.overall_score || 0,
      date: new Date(row.created_at).toLocaleDateString()
    }));

    return res.json({
      success: true,
      data: data.reverse()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "ESG trend failed" });
  }
};

// 🌍 Emissions - Return breakdown format
const getEmissions = async (req, res) => {
  try {
    const companyId = await getCompanyId(req.user.userId);

    const result = await pool.query(
      `SELECT metric_name, SUM(metric_value) AS total
       FROM esg_metrics em
       JOIN reports r ON em.report_id = r.id
       WHERE r.company_id = $1
       AND metric_name IN ('SCOPE_1','SCOPE_2','SCOPE_3')
       GROUP BY metric_name`,
      [companyId]
    );

    const breakdown = {
      scope1: 0,
      scope2: 0,
      scope3: 0
    };

    result.rows.forEach(row => {
      if (row.metric_name === 'SCOPE_1') breakdown.scope1 = parseInt(row.total) || 0;
      if (row.metric_name === 'SCOPE_2') breakdown.scope2 = parseInt(row.total) || 0;
      if (row.metric_name === 'SCOPE_3') breakdown.scope3 = parseInt(row.total) || 0;
    });

    return res.json({
      success: true,
      breakdown: breakdown
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Emissions data failed" });
  }
};

/**
 * Main company dashboard endpoint
 * Supports time range filtering via ?range=1m|3m|1y|ytd
 */
const getCompanyDashboard = async (req, res) => {
  try {
    const companyId = await getCompanyId(req.user.userId);
    const range = req.query.range || '1y';
    const dateFilter = getDateFilter(range);

    // 1️⃣ Latest ESG (within range)
    const esgResult = await pool.query(
      `SELECT 
        e.overall_score,
        e.environmental,
        e.social,
        e.governance,
        r.created_at,
        r.id as report_id
       FROM esg_scores e
       JOIN reports r ON e.report_id = r.id
       WHERE r.company_id = $1
       AND ${dateFilter}
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [companyId]
    );

    const latest = esgResult.rows[0];

    if (!latest) {
      return res.json({ 
        success: true, 
        data: {
          esgScore: null,
          environmentalScore: null,
          socialScore: null,
          governanceScore: null,
          carbonEmissions: '0 tCO₂',
          energyConsumption: '0 MWh',
          waterUsage: '0 m³',
          wasteGenerated: '0 kg',
          emissionsBreakdown: { scope1: 0, scope2: 0, scope3: 0 },
          trend: [],
          recommendations: []
        }
      });
    }

    // 2️⃣ KPI Aggregation (within range)
    const kpiResult = await pool.query(
      `SELECT metric_name, SUM(metric_value) AS total
       FROM esg_metrics em
       JOIN reports r ON em.report_id = r.id
       WHERE r.company_id = $1
       AND ${dateFilter}
       GROUP BY metric_name`,
      [companyId]
    );

    const kpis = {};
    kpiResult.rows.forEach(row => {
      kpis[row.metric_name] = parseFloat(row.total) || 0;
    });

    // 3️⃣ Trend Data (within range)
    const trendResult = await pool.query(
      `SELECT 
        e.overall_score,
        r.created_at
       FROM esg_scores e
       JOIN reports r ON e.report_id = r.id
       WHERE r.company_id = $1
       AND ${dateFilter}
       ORDER BY r.created_at DESC
       LIMIT 12`,
      [companyId]
    );

    const trendData = trendResult.rows.map((row, index) => ({
      month: `Report ${trendResult.rows.length - index}`,
      esg: row.overall_score
    })).reverse();

    const breakdown = {
      scope1: kpis.SCOPE_1 || 0,
      scope2: kpis.SCOPE_2 || 0,
      scope3: kpis.SCOPE_3 || 0
    };

    // 4️⃣ Recommendations from latest report
    const recResult = await pool.query(
      "SELECT title, description, impact, effort FROM ai_recommendations WHERE report_id = $1",
      [latest.report_id]
    );

    return res.json({
      success: true,
      data: {
        esgScore: latest.overall_score ?? null,
        environmentalScore: latest.environmental ?? null,
        socialScore: latest.social ?? null,
        governanceScore: latest.governance ?? null,

        carbonEmissions: `${kpis.CARBON_EMISSIONS || 0} tCO₂`,
        energyConsumption: `${kpis.ENERGY_CONSUMPTION || 0} MWh`,
        waterUsage: `${kpis.WATER_USAGE || 0} m³`,
        wasteGenerated: `${kpis.WASTE_GENERATED || 0} kg`,

        emissionsBreakdown: breakdown,
        trend: trendData,
        recommendations: recResult.rows
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Dashboard failed" });
  }
};

module.exports = {
  getDashboardSummary,
  getEsgTrend,
  getEmissions,
  getCompanyDashboard
};
