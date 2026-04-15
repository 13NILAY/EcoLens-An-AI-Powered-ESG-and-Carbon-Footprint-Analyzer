const pool = require("../config/db.js");

/**
 * Get Company Profile
 * GET /profile
 */
const getCompanyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT c.id, c.name as company_name, c.industry, c.country, c.market_cap,
              u.email, u.name as user_name
       FROM companies c
       JOIN users u ON c.user_id = u.id
       WHERE c.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Company profile not found" });
    }

    const row = result.rows[0];

    return res.json({
      success: true,
      data: {
        companyName: row.company_name,
        industry: row.industry,
        country: row.country,
        marketCap: row.market_cap,
        email: row.email,
        userName: row.user_name,
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch company profile" });
  }
};

/**
 * Update / Setup Company Profile
 * PUT /profile
 */
const updateCompanyProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { companyName, industry, country, marketCap } = req.body;

    if (!companyName || !industry || !country) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Ensure company exists for this user
    const companyResult = await pool.query(
      "SELECT id FROM companies WHERE user_id = $1",
      [userId]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    const companyId = companyResult.rows[0].id;

    // Update company profile
    const updated = await pool.query(
      `UPDATE companies
       SET name = $1, industry = $2, country = $3, market_cap = $4
       WHERE id = $5
       RETURNING id, name, industry, country, market_cap`,
      [companyName, industry, country, marketCap || null, companyId]
    );

    return res.json({
      message: "Company profile updated successfully",
      company: updated.rows[0]
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update company profile" });
  }
};

module.exports = { getCompanyProfile, updateCompanyProfile };
