const express = require("express");
const router = express.Router();
const notify = require("../controllers/notificationController");

router.post("/sendEmergencyApprovalEmail", notify.sendEmergencyApprovalEmail);
router.post("/sendNormalApprovalEmail", notify.sendNormalApprovalEmail);
router.post(
  "/sendEmergencyDisapprovalEmail",
  notify.sendEmergencyDisapprovalEmail,
);
router.post("/sendNormalDisapprovalEmail", notify.sendNormalDisapprovalEmail);

module.exports = router;
