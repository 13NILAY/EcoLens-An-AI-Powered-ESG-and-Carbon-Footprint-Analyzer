const express = require("express");
const router = express.Router();

const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
const { updateInvestorProfile } = require("../controllers/investor.profile.controller");
const {getInvestorProfile} = require("../controllers/investor.profile.controller")
router.get("/profile", authenticate, authorizeRoles("investor"), getInvestorProfile);

router.put(
  "/profile",
  authenticate,
  authorizeRoles("investor"),
  updateInvestorProfile
);

module.exports = router;
