const { pool } = require("../config/database");

const parsePositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const restrictedAssignableRoles = new Set(["driver", "conductor", "staff"]);

const isRestrictedAssignableRole = (roleName) =>
  restrictedAssignableRoles.has(String(roleName || "").toLowerCase());

const roles = async (req, res) => {
  try {
    const results = await pool.query(
      "SELECT role_id, role_name FROM roles ORDER BY role_name ASC",
    );
    res.json(
      results.filter((role) => !isRestrictedAssignableRole(role.role_name)),
    );
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).json({ error: "An error occurred while fetching roles" });
  }
};

const userRoles = async (req, res) => {
  const { userIds } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: "Invalid user IDs" });
  }

  const sanitizedUserIds = userIds
    .map((userId) => parsePositiveInt(userId))
    .filter(Boolean);

  if (sanitizedUserIds.length === 0) {
    return res.status(400).json({ error: "Invalid user IDs" });
  }

  const placeholders = sanitizedUserIds.map(() => "?").join(",");
  const sql = `
        SELECT ur.user_id, ur.role_id, r.role_name
        FROM user_role ur
        JOIN roles r ON ur.role_id = r.role_id
        WHERE ur.user_id IN (${placeholders})
        ORDER BY ur.user_id ASC, r.role_name ASC
    `;

  try {
    const results = await pool.query(sql, sanitizedUserIds);
    res.json(results);
  } catch (err) {
    console.error("Error fetching user roles:", err);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching user roles" });
  }
};

const assignRole = async (req, res) => {
  const userId = parsePositiveInt(req.params.userId);
  const roleId = parsePositiveInt(req.body.roleId);

  if (!userId || !roleId) {
    return res
      .status(400)
      .json({ error: "Valid user ID and role ID are required" });
  }

  try {
    const users = await pool.query(
      "SELECT user_id FROM Users WHERE user_id = ? LIMIT 1",
      [userId],
    );
    if (!users.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const rolesResult = await pool.query(
      "SELECT role_id, role_name FROM roles WHERE role_id = ? LIMIT 1",
      [roleId],
    );

    if (!rolesResult.length) {
      return res.status(404).json({ error: "Role not found" });
    }

    const roleName = String(rolesResult[0].role_name || "").toLowerCase();
    if (isRestrictedAssignableRole(roleName)) {
      return res.status(403).json({
        error: "This role cannot be assigned from Role Management",
      });
    }

    const existing = await pool.query(
      "SELECT 1 FROM user_role WHERE user_id = ? AND role_id = ? LIMIT 1",
      [userId, roleId],
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "This user already has this role" });
    }

    await pool.query("INSERT INTO user_role (user_id, role_id) VALUES (?, ?)", [
      userId,
      roleId,
    ]);

    return res.status(200).json({
      message: "Role assigned successfully",
      userId,
      roleId,
      roleName: rolesResult[0].role_name,
    });
  } catch (err) {
    console.error("Error assigning role:", err);
    return res
      .status(500)
      .json({ error: "An error occurred while assigning the role" });
  }
};

const unassignRole = async (req, res) => {
  const userId = parsePositiveInt(req.params.userId);
  const roleId = parsePositiveInt(req.body.roleId);

  if (!userId || !roleId) {
    return res
      .status(400)
      .json({ error: "Valid user ID and role ID are required" });
  }

  try {
    const users = await pool.query(
      "SELECT user_id FROM Users WHERE user_id = ? LIMIT 1",
      [userId],
    );
    if (!users.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const roleRows = await pool.query(
      "SELECT role_id, role_name FROM roles WHERE role_id = ? LIMIT 1",
      [roleId],
    );

    if (!roleRows.length) {
      return res.status(404).json({ error: "Role not found" });
    }

    const currentRole = await pool.query(
      `
                SELECT ur.user_id, ur.role_id, r.role_name
                FROM user_role ur
                JOIN roles r ON ur.role_id = r.role_id
                WHERE ur.user_id = ? AND ur.role_id = ?
                LIMIT 1
            `,
      [userId, roleId],
    );

    if (!currentRole.length) {
      return res
        .status(404)
        .json({ error: "This user does not have the selected role" });
    }

    const requestedRoleName = String(
      currentRole[0].role_name || "",
    ).toLowerCase();
    if (
      req.userId &&
      Number(req.userId) === userId &&
      requestedRoleName.includes("admin")
    ) {
      return res.status(403).json({
        error: "You cannot remove your own admin role from your account",
      });
    }

    await pool.query(
      "DELETE FROM user_role WHERE user_id = ? AND role_id = ?",
      [userId, roleId],
    );

    return res.status(200).json({
      message: "Role removed successfully",
      userId,
      roleId,
      roleName: currentRole[0].role_name,
    });
  } catch (err) {
    console.error("Error removing role:", err);
    return res
      .status(500)
      .json({ error: "An error occurred while removing the role" });
  }
};

module.exports = {
  roles,
  userRoles,
  assignRole,
  unassignRole,
};
