const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
const { 
  uploadReport, 
  getCompanyReports, 
  getReportKpis, 
  getReportById, 
  exportReport, 
  downloadReport 
} = require("../controllers/company.controller");
const { getCompanyProfile, updateCompanyProfile } = require("../controllers/company.profie.controller");
const multer = require("multer");
const {
  getDashboardSummary,
  getEsgTrend,
  getEmissions,
  getCompanyDashboard
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

// Dashboard routes
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

router.get(
  "/dashboard",
  authenticate,
  authorizeRoles("company"),
  getCompanyDashboard
);

// Profile routes
router.get(
  "/profile",
  authenticate,
  authorizeRoles("company"),
  getCompanyProfile
);

router.put(
  "/profile",
  authenticate,
  authorizeRoles("company"),
  updateCompanyProfile
);

// Report routes (specific routes MUST come before parameterized routes)
router.get(
  "/reports",
  authenticate,
  authorizeRoles("company"),
  getCompanyReports
);

router.get(
  "/reports/:id/export",
  authenticate,
  authorizeRoles("company"),
  exportReport
);

router.get(
  "/reports/:id/download",
  authenticate,
  authorizeRoles("company"),
  downloadReport
);

router.get(
  "/reports/:id",
  authenticate,
  authorizeRoles("company"),
  getReportById
);

router.get(
  "/kpis/:reportId", 
  authenticate, 
  authorizeRoles("company"), 
  getReportKpis
);

module.exports = router;
