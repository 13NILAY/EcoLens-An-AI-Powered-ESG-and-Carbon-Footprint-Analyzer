const pool = require("../config/db.js");

const ALLOWED_INDUSTRIES = [
  "technology",
  "finance",
  "fmcg",
  "manufacturing",
  "energy"
];

// Get investor profile
const getInvestorProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      `SELECT id, risk_tolerance, min_esg_score, preferred_industries 
       FROM investor_profiles 
       WHERE user_id = $1`,
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// Setup / Update Investor Profile (upsert – creates if missing)
const updateInvestorProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { riskTolerance, minEsgScore, preferredIndustries } = req.body;

    if (!riskTolerance || minEsgScore === undefined) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Validate preferred industries
    const validIndustries = (preferredIndustries || []).filter(i =>
      ALLOWED_INDUSTRIES.includes(i)
    );

    // Check if investor profile exists
    const profileResult = await pool.query(
      "SELECT id FROM investor_profiles WHERE user_id = $1",
      [userId]
    );

    let result;

    if (profileResult.rows.length === 0) {
      // CREATE new profile
      result = await pool.query(
        `INSERT INTO investor_profiles (user_id, risk_tolerance, min_esg_score, preferred_industries)
         VALUES ($1, $2, $3, $4)
         RETURNING id, risk_tolerance, min_esg_score, preferred_industries`,
        [userId, riskTolerance, minEsgScore, JSON.stringify(validIndustries)]
      );
    } else {
      // UPDATE existing profile
      const profileId = profileResult.rows[0].id;
      result = await pool.query(
        `UPDATE investor_profiles
         SET risk_tolerance = $1, min_esg_score = $2, preferred_industries = $3
         WHERE id = $4
         RETURNING id, risk_tolerance, min_esg_score, preferred_industries`,
        [riskTolerance, minEsgScore, JSON.stringify(validIndustries), profileId]
      );
    }

    return res.json({
      message: "Investor profile saved successfully",
      profile: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to save investor profile" });
  }
};

module.exports = { updateInvestorProfile, getInvestorProfile };
