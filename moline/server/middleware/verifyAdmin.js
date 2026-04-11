const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");

const secretKey = "Vv2N9SCG8RncrDGvfOYlFkaRpm25MA3mRaSCtjPcke4=";

const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = jwt.verify(token, secretKey);
    if (!decoded || !decoded.user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (String(decoded.role_id || "") === "1") {
      req.userId = decoded.user_id;
      req.userRoleId = decoded.role_id;
      return next();
    }

    const rows = await pool.query(
      `
        SELECT r.role_name
        FROM user_role ur
        INNER JOIN roles r ON r.role_id = ur.role_id
        WHERE ur.user_id = ?
        LIMIT 1
      `,
      [decoded.user_id],
    );

    const roleName = String(rows?.[0]?.role_name || "").toLowerCase();
    if (!roleName.includes("admin")) {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.userId = decoded.user_id;
    req.userRole = roleName;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = verifyAdmin;
