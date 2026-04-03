const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { pool } = require("../config/database");

// POST /api/forms/withdrawal
// Accepts { fullName, email, reason }
// If an Authorization bearer token is present, prefer user details from the token + DB
router.post("/withdrawal", async (req, res) => {
  try {
    let { fullName, email, reason, password } = req.body || {};

    // Basic validation
    if (!reason || String(reason).trim() === "") {
      return res.status(400).json({ error: "Reason is required" });
    }

    // Try to derive user from Authorization header if present and verify password
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (token) {
      try {
        const secretKey = "Vv2N9SCG8RncrDGvfOYlFkaRpm25MA3mRaSCtjPcke4=";
        const decoded = jwt.verify(token, secretKey);
        if (decoded && decoded.user_id) {
          // Fetch user details from DB and override fullName/email
          const rows = await pool.query(
            "SELECT first_name, last_name, email, password FROM Users WHERE user_id = ?",
            [decoded.user_id],
          );
          if (rows && rows.length > 0) {
            const u = rows[0];
            fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
            email = u.email || email;

            // Require the user's current login password to confirm withdrawal
            if (!password) {
              return res.status(400).json({ error: "Password is required" });
            }

            // Support both bcrypt-hashed and legacy plain passwords
            const stored = u.password || "";
            let passwordOk = false;
            try {
              if (typeof stored === "string" && stored.startsWith("$2")) {
                passwordOk = await bcrypt.compare(password, stored);
              } else {
                // Fallback: direct equality if not hashed (legacy)
                passwordOk = password === stored;
              }
            } catch (e) {
              passwordOk = false;
            }

            if (!passwordOk) {
              return res.status(401).json({ error: "Invalid password" });
            }
          } else {
            return res
              .status(401)
              .json({ error: "Invalid token or user not found" });
          }
        }
      } catch (err) {
        // token invalid — require authentication instead of accepting anonymous submission
        console.warn("Invalid token on withdrawal submission");
        return res.status(401).json({ error: "Authentication required" });
      }
    } else {
      // For security, require authentication and password confirmation
      return res.status(401).json({ error: "Authentication required" });
    }

    // Log normalized payload (avoid logging sensitive tokens or passwords)
    console.log("Received withdrawal form (normalized):", {
      fullName,
      email,
      reason,
    });

    // TODO: persist the withdrawal request in DB if required. For now, return success.
    return res.json({ message: "Form submitted successfully" });
  } catch (err) {
    console.error("Error handling withdrawal form:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

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
