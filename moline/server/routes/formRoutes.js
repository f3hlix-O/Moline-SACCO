const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { pool } = require("../config/database");
const withdrawalController = require("../controllers/withdrawalController");

// POST /api/forms/withdrawal
router.post("/withdrawal", withdrawalController.submitWithdrawal);

module.exports = router;

// POST /api/forms/withdrawal/verify-download
// Accepts { password } and requires Authorization bearer token.
router.post("/withdrawal/verify-download", async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password)
      return res.status(400).json({ error: "Password is required" });

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
    if (!token)
      return res.status(401).json({ error: "Authentication required" });

    try {
      const secretKey = "Vv2N9SCG8RncrDGvfOYlFkaRpm25MA3mRaSCtjPcke4=";
      const decoded = jwt.verify(token, secretKey);
      if (!decoded || !decoded.user_id)
        return res.status(401).json({ error: "Invalid token" });

      const rows = await pool.query(
        "SELECT password FROM Users WHERE user_id = ?",
        [decoded.user_id],
      );
      if (!rows || rows.length === 0)
        return res.status(401).json({ error: "User not found" });

      const stored = rows[0].password || "";
      let ok = false;
      try {
        if (typeof stored === "string" && stored.startsWith("$2")) {
          ok = await bcrypt.compare(password, stored);
        } else {
          ok = password === stored;
        }
      } catch (e) {
        ok = false;
      }

      if (!ok) return res.status(401).json({ error: "Invalid password" });

      return res.json({ message: "Verified" });
    } catch (err) {
      console.warn("Invalid token on download verification");
      return res.status(401).json({ error: "Authentication required" });
    }
  } catch (err) {
    console.error("Error verifying download password:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
