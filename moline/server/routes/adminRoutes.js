const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const withdrawalController = require("../controllers/withdrawalController");
const verifyAdmin = require("../middleware/verifyAdmin");

router.get("/users-approved", adminController.getApprovedUsers);
router.get("/users-pending-approval", adminController.getPendingUsers);
router.post("/approve-user", adminController.approveUser);
router.post("/disapprove-user", adminController.disapproveUser);
router.post("/admin-login", adminController.adminLogin);
router.get("/savings", adminController.getAllUserSavings);
router.get("/support-tickets", verifyAdmin, adminController.getSupportTickets);
router.get("/withdrawals", withdrawalController.getAdminWithdrawals);
router.patch(
  "/withdrawals/:withdrawalId/status",
  withdrawalController.updateWithdrawalStatus,
);

module.exports = router;
