const pool = require("../config/db");
// Helper to generate random number in range
const randomInRange = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Calculate ESG grade
const calculateGrade = (score) => {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  return "C";
};

const uploadReport = async (req, res) => {
  try {
    const companyUserId = req.user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Get company ID
    const companyResult = await pool.query(
      "SELECT id FROM companies WHERE user_id = $1",
      [companyUserId]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    const companyId = companyResult.rows[0].id;

    // Insert report record
    const reportResult = await pool.query(
      `INSERT INTO reports (company_id, file_name, file_type, file_url, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
      [companyId, file.originalname, file.mimetype, file.path, "uploaded"]
    );

    const reportId = reportResult.rows[0].id;
    // Generate dummy ESG scores
const environmental = randomInRange(60, 90);
const social = randomInRange(55, 85);
const governance = randomInRange(50, 80);

const overall = Math.round(
  0.5 * environmental +
  0.3 * social +
  0.2 * governance
);

const grade = calculateGrade(overall);

// Insert ESG scores
await pool.query(
  `INSERT INTO esg_scores 
   (report_id, environmental, social, governance, overall_score, grade)
   VALUES ($1, $2, $3, $4, $5, $6)`,
  [reportId, environmental, social, governance, overall, grade]
);
const metrics = [
  { name: "scope1", value: randomInRange(500, 2000) },
  { name: "scope2", value: randomInRange(300, 1500) },
  { name: "scope3", value: randomInRange(1000, 5000) },
  { name: "energy", value: randomInRange(10000, 50000) },
  { name: "water", value: randomInRange(5000, 20000) },
  { name: "waste", value: randomInRange(200, 1000) }
];

for (const metric of metrics) {
  await pool.query(
    `INSERT INTO esg_metrics (report_id, metric_name, metric_value)
     VALUES ($1, $2, $3)`,
    [reportId, metric.name, metric.value]
  );
}


    return res.status(201).json({
      message: "Report uploaded successfully",
      file: file.originalname
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Upload failed" });
  }
};

module.exports = { uploadReport };
