const express = require("express");
const router = express.Router();

const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
const {
  getCompanies,
  getDashboardSummary,
  getIndustryPerformance,
  getEsgSentimentTrend
} = require("../controllers/investor.dashboard.controller");

router.get("/companies", authenticate, authorizeRoles("investor"), getCompanies);
router.get("/dashboard/summary", authenticate, authorizeRoles("investor"), getDashboardSummary);
router.get("/dashboard/industry-performance", authenticate, authorizeRoles("investor"), getIndustryPerformance);
router.get("/dashboard/esg-sentiment-trend", authenticate, authorizeRoles("investor"), getEsgSentimentTrend);

module.exports = router;
