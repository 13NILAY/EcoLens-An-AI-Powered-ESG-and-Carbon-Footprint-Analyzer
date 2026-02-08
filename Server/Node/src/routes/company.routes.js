const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
const { uploadReport } = require("../controllers/company.controller");
const { updateCompanyProfile } = require("../controllers/company.profie.controller");

const multer = require("multer");
const {
  getDashboardSummary,
  getEsgTrend,
  getEmissions
} = require("../controllers/company.dashboard.controller");

// Multer config
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Upload route
router.post(
  "/upload",
  authenticate,
  authorizeRoles("company"),
  upload.single("report"),
  uploadReport
);
router.get(
  "/dashboard/summary",
  authenticate,
  authorizeRoles("company"),
  getDashboardSummary
);

router.get(
  "/dashboard/esg-trend",
  authenticate,
  authorizeRoles("company"),
  getEsgTrend
);

router.get(
  "/dashboard/emissions",
  authenticate,
  authorizeRoles("company"),
  getEmissions
);

router.put(
  "/profile",
  authenticate,
  authorizeRoles("company"),
  updateCompanyProfile
);



module.exports = router;
