const pool = require("../config/db.js");

// Setup / Update Investor Profile
const updateInvestorProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { riskTolerance, minEsgScore } = req.body;

    if (!riskTolerance || minEsgScore === undefined) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Check if investor profile exists
    const profileResult = await pool.query(
      "SELECT id FROM investor_profiles WHERE user_id = $1",
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ message: "Investor profile not found" });
    }

    const profileId = profileResult.rows[0].id;

    // Update investor profile
    const updated = await pool.query(
      `UPDATE investor_profiles
       SET risk_tolerance = $1, min_esg_score = $2
       WHERE id = $3
       RETURNING id, risk_tolerance, min_esg_score`,
      [riskTolerance, minEsgScore, profileId]
    );

    return res.json({
      message: "Investor profile updated successfully",
      profile: updated.rows[0]
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update investor profile" });
  }
};

module.exports = { updateInvestorProfile };
