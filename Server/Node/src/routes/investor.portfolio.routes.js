const express = require("express");
const router = express.Router();

const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
const { buildPortfolio, getPortfolio, savePortfolio } = require("../controllers/investor.portfolio.controller");

// Get suggested portfolio based on preferences
router.get(
  "/portfolio/build",
  authenticate,
  authorizeRoles("investor"),
  buildPortfolio
);

// Get saved portfolio
router.get(
  "/portfolio",
  authenticate,
  authorizeRoles("investor"),
  getPortfolio
);

// Save or update portfolio
router.post(
  "/portfolio",
  authenticate,
  authorizeRoles("investor"),
  savePortfolio
);

module.exports = router;
