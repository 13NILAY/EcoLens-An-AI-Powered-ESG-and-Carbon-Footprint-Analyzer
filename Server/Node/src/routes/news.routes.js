const express = require("express");
const router = express.Router();

const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
const {
  getNewsOverview,
  getNewsCompanies,
  getNewsTopAlerts,
  getCompanyNews,
  getCompanyNewsSummary,
} = require("../controllers/news.controller");

// Dashboard APIs
router.get("/news/overview", authenticate, authorizeRoles("investor"), getNewsOverview);
router.get("/news/companies", authenticate, authorizeRoles("investor"), getNewsCompanies);
router.get("/news/top-alerts", authenticate, authorizeRoles("investor"), getNewsTopAlerts);

// Company-specific APIs
router.get("/news/company/:name", authenticate, authorizeRoles("investor"), getCompanyNews);
router.get("/news/company/:name/summary", authenticate, authorizeRoles("investor"), getCompanyNewsSummary);

module.exports = router;
