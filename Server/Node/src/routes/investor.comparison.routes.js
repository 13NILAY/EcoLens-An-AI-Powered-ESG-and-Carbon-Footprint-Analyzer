const express = require("express");
const router = express.Router();

const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
const {
  getCompanyList,
  compareCompanies
} = require("../controllers/investor.comparison.controller");

router.get(
  "/companies/list",
  authenticate,
  authorizeRoles("investor"),
  getCompanyList
);

router.get(
  "/compare",
  authenticate,
  authorizeRoles("investor"),
  compareCompanies
);

module.exports = router;
