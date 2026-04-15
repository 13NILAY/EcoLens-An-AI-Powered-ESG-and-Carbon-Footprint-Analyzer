const pool = require("../config/db.js");

// 1. Build portfolio based on investor preferences
const buildPortfolio = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // 1. Get investor preferences
    const profileResult = await pool.query(
      "SELECT risk_tolerance, min_esg_score FROM investor_profiles WHERE user_id = $1",
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ 
        message: "Investor profile not found. Please complete your profile setup first.",
        profileSetupRequired: true
      });
    }

    const { risk_tolerance, min_esg_score } = profileResult.rows[0];

    // 2. Get eligible companies (latest ESG per company)
    const companiesResult = await pool.query(
      `
      SELECT DISTINCT ON (c.id)
        c.id,
        c.name,
        c.industry,
        es.overall_score
      FROM companies c
      JOIN reports r ON r.company_id = c.id
      JOIN esg_scores es ON es.report_id = r.id
      WHERE es.overall_score >= $1
      AND c.id IS NOT NULL
      AND c.name IS NOT NULL
      ORDER BY c.id, r.created_at DESC
      `,
      [min_esg_score]
    );

    if (companiesResult.rows.length === 0) {
      return res.status(404).json({ 
        message: "No companies found matching your ESG criteria",
        minEsgScore: min_esg_score
      });
    }

    // 3. Group by industry
    const industryMap = {};
    companiesResult.rows.forEach(company => {
      if (!industryMap[company.industry]) {
        industryMap[company.industry] = [];
      }
      industryMap[company.industry].push(company);
    });

    // 4. Pick top company per industry
    const portfolio = Object.values(industryMap).map(list =>
      list.sort((a, b) => b.overall_score - a.overall_score)[0]
    );

    if (portfolio.length === 0) {
      return res.status(500).json({ message: "Failed to build portfolio" });
    }

    const weight = Math.round(100 / portfolio.length);

    const portfolioWithWeights = portfolio.map(c => ({
      companyId: c.id,
      name: c.name,
      industry: c.industry,
      esgScore: parseFloat(c.overall_score) || 0,
      weight
    }));

    const avgEsg =
      portfolioWithWeights.reduce((sum, c) => sum + c.esgScore, 0) /
      portfolioWithWeights.length;

    res.json({
      portfolio: portfolioWithWeights,
      averageEsgScore: Number(avgEsg.toFixed(2)),
      riskProfile: risk_tolerance,
      totalCompanies: portfolioWithWeights.length
    });

  } catch (error) {
    console.error("Error building portfolio:", error);
    res.status(500).json({ message: "Failed to build portfolio", error: error.message });
  }
};

// 2. Get saved portfolio for investor
const getPortfolio = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const result = await pool.query(
      `SELECT id, user_id, portfolio_data, created_at, updated_at
       FROM investor_portfolios 
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: "No saved portfolio found",
        data: null
      });
    }

    const portfolio = result.rows[0];
    res.json({
      id: portfolio.id,
      portfolio: Array.isArray(portfolio.portfolio_data) ? portfolio.portfolio_data : JSON.parse(portfolio.portfolio_data || '[]'),
      createdAt: portfolio.created_at,
      updatedAt: portfolio.updated_at
    });

  } catch (error) {
    console.error("Error fetching portfolio:", error);
    res.status(500).json({ message: "Failed to fetch portfolio", error: error.message });
  }
};

// 3. Save or update investor portfolio
const savePortfolio = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { portfolio, averageEsgScore, riskProfile } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!portfolio || !Array.isArray(portfolio)) {
      return res.status(400).json({ 
        message: "Portfolio array is required",
        received: typeof portfolio
      });
    }

    if (portfolio.length === 0) {
      return res.status(400).json({ 
        message: "Portfolio cannot be empty"
      });
    }

    // Check if portfolio exists
    const existingResult = await pool.query(
      "SELECT id FROM investor_portfolios WHERE user_id = $1",
      [userId]
    );

    let result;
    if (existingResult.rows.length > 0) {
      // Update existing portfolio
      result = await pool.query(
        `UPDATE investor_portfolios 
         SET portfolio_data = $2, updated_at = NOW()
         WHERE user_id = $1
         RETURNING id, user_id, portfolio_data, created_at, updated_at`,
        [userId, JSON.stringify(portfolio)]
      );
    } else {
      // Create new portfolio table entry if it doesn't exist
      result = await pool.query(
        `INSERT INTO investor_portfolios (user_id, portfolio_data, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING id, user_id, portfolio_data, created_at, updated_at`,
        [userId, JSON.stringify(portfolio)]
      );
    }

    const savedPortfolio = result.rows[0];
    res.json({
      message: "Portfolio saved successfully",
      id: savedPortfolio.id,
      portfolio: Array.isArray(savedPortfolio.portfolio_data) ? savedPortfolio.portfolio_data : JSON.parse(savedPortfolio.portfolio_data),
      createdAt: savedPortfolio.created_at,
      updatedAt: savedPortfolio.updated_at
    });

  } catch (error) {
    console.error("Error saving portfolio:", error);
    
    // Check if it's a table creation issue
    if (error.message.includes("does not exist")) {
      return res.status(500).json({ 
        message: "Portfolio storage not initialized. Please contact admin.",
        error: "Table not found"
      });
    }

    res.status(500).json({ message: "Failed to save portfolio", error: error.message });
  }
};

module.exports = { buildPortfolio, getPortfolio, savePortfolio };
