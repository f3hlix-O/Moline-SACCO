const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const verifyToken = require("../middleware/verifyToken");

router.get("/", roleController.roles);
router.post("/user-roles", roleController.userRoles);
router.post("/:userId/assignRole", verifyToken, roleController.assignRole);
router.post("/:userId/unassignRole", verifyToken, roleController.unassignRole);

module.exports = router;
