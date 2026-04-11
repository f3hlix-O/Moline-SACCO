const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const verifyToken = require("../middleware/verifyToken");

router.get("/matatuDetails", verifyToken, reportController.getMatatusDetails);
router.get(
  "/financialDetails",
  verifyToken,
  reportController.getFinancialDetails,
);
router.get("/compliance", verifyToken, reportController.getComplianceReport);
router.get(
  "/compliance/download",
  verifyToken,
  reportController.downloadComplianceReport,
);

module.exports = router;
