const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { uploadSingle } = require("../middleware/multerConfig");
const verifyToken = require("../middleware/verifyToken");

router.get("/", userController.getAllUsers);
router.post("/check-email", userController.checkEmail);
router.post("/signup", uploadSingle("id_image"), userController.signup);
router.post("/login", userController.login);
router.post("/reset-password", userController.resetPasswordByEmail);
router.post("/reset-password/confirm", userController.resetPasswordConfirm);
router.get("/userDetails", verifyToken, userController.getUserDetails);
router.post(
  "/support/tickets",
  verifyToken,
  uploadSingle("attachment"),
  userController.createSupportTicket,
);
router.get("/:userId", userController.getUserById);
router.put("/:userId/update", userController.updateUser);
router.post("/:userId/resetPassword", userController.resetPassword);
router.delete("/:userId/delete", userController.deleteUser);
router.post("/requestSalaryAdvance", userController.requestSalaryAdvance);

module.exports = router;
