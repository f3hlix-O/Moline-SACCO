const express = require("express");
const router = express.Router();

// POST /api/forms/withdrawal
router.post("/withdrawal", (req, res) => {
  try {
    console.log("Received withdrawal form:", req.body);
    return res.json({ message: "Form submitted successfully" });
  } catch (err) {
    console.error("Error handling withdrawal form:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
