const express = require("express");
const router = express.Router();
const driverController = require("../controllers/driverController");
const verifyToken = require("../middleware/verifyToken");

router.get("/", verifyToken, driverController.getAllDriversForAdmin);
router.get("/vehicles", verifyToken, driverController.getAvailableVehicles);
router.get("/owner/vehicles", verifyToken, driverController.getOwnerVehicles);
router.get("/:id", verifyToken, driverController.getDriverById);
router.post("/", verifyToken, driverController.createDriver);
router.put("/:id", verifyToken, driverController.updateDriver);
router.patch(
  "/:id/assign-vehicle",
  verifyToken,
  driverController.assignDriverToVehicle,
);
router.patch(
  "/:id/unassign-vehicle",
  verifyToken,
  driverController.unassignDriverFromVehicle,
);
router.patch(
  "/:id/reassign-vehicle",
  verifyToken,
  driverController.reassignDriverToVehicle,
);

module.exports = router;
