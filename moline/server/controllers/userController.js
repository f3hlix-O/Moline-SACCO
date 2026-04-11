const { pool } = require("../config/database");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const secretKey = "Vv2N9SCG8RncrDGvfOYlFkaRpm25MA3mRaSCtjPcke4=";
const { sendWelcomeEmail, sendResetPasswordEmail } = require("../utils/mailer");
const dotenv = require("dotenv");

// Helper to generate a stable staff number for a user (computed if DB column missing)
const generateStaffNumber = (userId) => `STF${String(userId).padStart(6, "0")}`;

const removeStaffFromRoles = (rolesValue) => {
  if (!rolesValue) {
    return rolesValue;
  }

  return String(rolesValue)
    .split(",")
    .map((role) => role.trim())
    .filter((role) => role && role.toLowerCase() !== "staff")
    .join(", ");
};

const getAllUsers = (req, res) => {
  pool.query("SELECT * FROM Users", (error, results) => {
    if (error) throw error;
    res.json(results);
  });
};

const AllUsersWithRoles = (req, res) => {
  const sql = `
        SELECT 
            u.*, 
            COALESCE(GROUP_CONCAT(r.role_name), '') AS roles
        FROM 
            Users u
        LEFT JOIN 
            user_role ur ON u.user_id = ur.user_id
        LEFT JOIN 
            roles r ON ur.role_id = r.role_id
        GROUP BY 
            u.user_id
    `;
  pool.query(sql, (error, results) => {
    if (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "An unexpected error occurred" });
      return;
    }
    res.json(results);
  });
};

const checkEmail = (req, res) => {
  const { email } = req.body;
  pool.query(
    "SELECT * FROM Users WHERE email = ?",
    [email],
    (error, results) => {
      if (error) {
        console.error("Error checking email:", error);
        res
          .status(500)
          .json({ error: "An error occurred while checking email" });
        return;
      }
      res.json({ exists: results.length > 0 });
    },
  );
};

const signup = async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    national_id,
    address,
    password,
    gender,
  } = req.body;
  const id_image = req.file ? req.file.filename : null;
  console.log("file: ", req.file);

  if (!email || !password || !gender) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Ensure email is unique
    const existing = await pool.query(
      "SELECT user_id FROM Users WHERE email = ?",
      [email],
    );
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the Users table
    const sqlInsertUser = `
            INSERT INTO Users (first_name, last_name, email, phone, national_id, address, password, gender, ID_image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    const userValues = [
      first_name,
      last_name,
      email,
      phone,
      national_id,
      address,
      hashedPassword,
      gender,
      id_image,
    ];
    const results = await pool.query(sqlInsertUser, userValues);
    const userId = results && results.insertId;

    // send welcome email (non-blocking behavior)
    sendWelcomeEmail(email, first_name).catch((err) =>
      console.warn("Welcome email failed", err),
    );

    const sqlInsertUserRole = `
                INSERT INTO user_role (user_id, role_id)
                VALUES (?, ?)
            `;
    const roleValues = [userId, 203];
    await pool.query(sqlInsertUserRole, roleValues);

    // Persist staff number if the DB has the column; otherwise the API will
    // compute a stable staff number when returning user data.
    try {
      const colCheck = await pool.query(
        "SHOW COLUMNS FROM Users LIKE 'staff_number'",
      );
      if (colCheck && colCheck.length > 0) {
        const staffNumber = generateStaffNumber(userId);
        await pool.query(
          "UPDATE Users SET staff_number = ? WHERE user_id = ?",
          [staffNumber, userId],
        );
      }
    } catch (e) {
      console.warn(
        "Could not set staff_number column (may not exist):",
        e.message || e,
      );
    }

    return res.json({
      message: "User signed up successfully and role assigned",
      userId,
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

const login = (req, res) => {
  const { email, password } = req.body;
  const sql = `
        SELECT Users.*, user_role.role_id
        FROM Users
        LEFT JOIN user_role ON Users.user_id = user_role.user_id
        WHERE Users.email = ?
    `;
  pool.query(sql, [email], async (error, results) => {
    if (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ error: "An unexpected error occurred" });
      return;
    }
    if (results.length === 0) {
      res.status(401).json({ error: "No user with the given email" });
    } else {
      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ error: "Invalid email or password" });
      } else {
        const userResponse = {
          user_id: user.user_id,
          email: user.email,
          status: user.status,
          role_id: user.role_id,
          staff_number: user.staff_number || generateStaffNumber(user.user_id),
        };

        const token = jwt.sign(userResponse, secretKey, { expiresIn: "12h" });
        res.json({ message: "Login successful", user: userResponse, token });
      }
    }
  });
};

const getUserById = (req, res) => {
  const { userId } = req.params;
  const sql = `
        SELECT 
            u.*, 
            GROUP_CONCAT(r.role_name) AS roles
        FROM 
            Users u
        LEFT JOIN 
            user_role ur ON u.user_id = ur.user_id
        LEFT JOIN 
            roles r ON ur.role_id = r.role_id
        WHERE 
            u.user_id = ?
        GROUP BY 
            u.user_id
    `;
  pool.query(sql, [userId], (error, results) => {
    if (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "An unexpected error occurred" });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const user = results[0];
    user.staff_number = user.staff_number || generateStaffNumber(user.user_id);
    user.roles = removeStaffFromRoles(user.roles);
    res.json(user);
  });
};

const getUserDetails = (req, res) => {
  const { userId } = req;
  const sql = `
        SELECT 
            u.*, 
            GROUP_CONCAT(r.role_name) AS roles
        FROM 
            Users u
        LEFT JOIN 
            user_role ur ON u.user_id = ur.user_id
        LEFT JOIN 
            roles r ON ur.role_id = r.role_id
        WHERE 
            u.user_id = ?
        GROUP BY 
            u.user_id
    `;
  pool.query(sql, [userId], (error, results) => {
    if (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "An unexpected error occurred" });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const user = results[0];
    user.staff_number = user.staff_number || generateStaffNumber(user.user_id);
    user.roles = removeStaffFromRoles(user.roles);
    res.json(user);
  });
};

// Lookup user by staff number (supports persisted column or computed STF<id> format)
const getUserByStaffNumber = async (req, res) => {
  const { staffNumber } = req.params;
  if (!staffNumber)
    return res.status(400).json({ error: "staffNumber required" });
  try {
    // If column exists, try direct lookup
    try {
      const colCheck = await pool.query(
        "SHOW COLUMNS FROM Users LIKE 'staff_number'",
      );
      if (colCheck && colCheck.length > 0) {
        const rows = await pool.query(
          "SELECT user_id, first_name, last_name, staff_number FROM Users WHERE staff_number = ? LIMIT 1",
          [staffNumber],
        );
        if (rows && rows.length > 0) return res.json(rows[0]);
      }
    } catch (e) {
      // ignore and fallback to computed format
    }

    // Fallback parse STF000123 -> user_id 123
    const match = /^STF0*(\d+)$/.exec(staffNumber);
    let userId = null;
    if (match) userId = parseInt(match[1], 10);
    else if (/^\d+$/.test(staffNumber)) userId = parseInt(staffNumber, 10);

    if (userId !== null) {
      const rows = await pool.query(
        "SELECT user_id, first_name, last_name FROM Users WHERE user_id = ? LIMIT 1",
        [userId],
      );
      if (rows && rows.length > 0) {
        const user = rows[0];
        user.staff_number = generateStaffNumber(user.user_id);
        return res.json(user);
      }
    }

    return res.status(404).json({ error: "User not found" });
  } catch (err) {
    console.error("Error in getUserByStaffNumber:", err);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
};

const updateUser = (req, res) => {
  const { userId } = req.params;
  const { first_name, last_name, email } = req.body;
  const sql =
    "UPDATE Users SET first_name = ?, last_name = ?, email = ? WHERE user_id = ?";
  pool.query(sql, [first_name, last_name, email, userId], (error, results) => {
    if (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "An unexpected error occurred" });
      return;
    }
    res.json({ message: "User information updated successfully" });
  });
};

const resetPassword = (req, res) => {
  const { userId } = req.params;
  const defaultPassword = "newPassword123";
  const sql = "UPDATE Users SET password = ? WHERE user_id = ?";
  pool.query(sql, [defaultPassword, userId], (error, results) => {
    if (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "An unexpected error occurred" });
      return;
    }
    res.json({ message: "Password reset successfully" });
  });
};

// POST /api/users/reset-password
// Accepts JSON { email } -> generates a secure token, persists it with an expiry,
// and emails a reset link containing the token and email as query params.
const resetPasswordByEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const rows = await pool.query("SELECT * FROM Users WHERE email = ?", [
      email,
    ]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Email not found" });
    }

    // Generate secure token and expiry (unique per request)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    // Persist token and expiry
    await pool.query(
      "UPDATE Users SET reset_token = ?, reset_token_expires = ? WHERE email = ?",
      [resetToken, expiresAt, email],
    );

    // Helpful debug logs during development
    console.log(
      `Generated reset token for ${email} -> token=${resetToken} expiresAt=${expiresAt}`,
    );

    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      email,
    )}`;

    try {
      await sendResetPasswordEmail(email, resetLink);
      console.log(`Password reset email queued/sent to ${email}`);
      return res.json({ message: "Password reset email sent" });
    } catch (mailErr) {
      console.error("Failed to send password reset email:", mailErr);
      return res.status(500).json({ error: "Failed to send email" });
    }
  } catch (err) {
    console.error("Error in resetPasswordByEmail:", err);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
};

// POST /api/users/reset-password/confirm
const resetPasswordConfirm = async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return res
      .status(400)
      .json({ error: "email, token and newPassword are required" });
  }

  try {
    const rows = await pool.query(
      "SELECT password, reset_token, reset_token_expires FROM Users WHERE email = ?",
      [email],
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Email not found" });
    }

    const user = rows[0];

    // Log stored values for debugging (dev only)
    console.log(
      `Reset confirm for ${email}: providedToken=${token} storedToken=${user.reset_token} storedExpiry=${user.reset_token_expires}`,
    );

    if (!user.reset_token || !user.reset_token_expires) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    if (user.reset_token !== token) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    if (Date.now() > Number(user.reset_token_expires)) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Prevent using the same password as before
    if (user.password) {
      const isSame = await bcrypt.compare(newPassword, user.password);
      if (isSame) {
        return res.status(400).json({
          error: "New password cannot be the same as the old password",
        });
      }
    }

    // Hash new password and update user; clear token only after successful update
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE Users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?",
      [hashed, email],
    );

    console.log(`Password updated and reset token cleared for ${email}`);
    return res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("Error during password reset confirm:", err);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
};
const deleteUser = (req, res) => {
  const { userId } = req.params;

  const sqlDeleteUserRole = "DELETE FROM user_role WHERE user_id = ?";
  const sqlDeleteUser = "DELETE FROM Users WHERE user_id = ?";

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting database connection:", err);
      res.status(500).json({ error: "An unexpected error occurred" });
      return;
    }

    connection.beginTransaction((err) => {
      if (err) {
        console.error("Error starting transaction:", err);
        res.status(500).json({ error: "An unexpected error occurred" });
        connection.release();
        return;
      }

      connection.query(sqlDeleteUserRole, [userId], (error, results) => {
        if (error) {
          console.error("Error deleting from user_role:", error);
          return connection.rollback(() => {
            res.status(500).json({ error: "An unexpected error occurred" });
            connection.release();
          });
        }

        connection.query(sqlDeleteUser, [userId], (error, results) => {
          if (error) {
            console.error("Error deleting user:", error);
            return connection.rollback(() => {
              res.status(500).json({ error: "An unexpected error occurred" });
              connection.release();
            });
          }

          connection.commit((err) => {
            if (err) {
              console.error("Error committing transaction:", err);
              return connection.rollback(() => {
                res.status(500).json({ error: "An unexpected error occurred" });
                connection.release();
              });
            }

            res.json({ message: "User deleted successfully" });
            connection.release();
          });
        });
      });
    });
  });
};

const requestSalaryAdvance = (req, res) => {
  const { userId, amount, reason } = req.body;
  const sql =
    "INSERT INTO SalaryAdvances (user_id, amount, reason, status) VALUES (?, ?, ?, ?)";
  pool.query(sql, [userId, amount, reason, "pending"], (error, results) => {
    if (error) {
      console.error("Error inserting salary advance request:", error);
      res
        .status(500)
        .json({ error: "An error occurred while inserting the request" });
      return;
    }
    res.json({
      message: "Salary advance request submitted successfully",
      requestId: results.insertId,
    });
  });
};

const createSupportTicket = async (req, res) => {
  // Log incoming body and file for debugging
  console.log("createSupportTicket req.body:", req.body);
  console.log("createSupportTicket req.file:", req.file);

  // Normalize attachment: prefer multer file, else body.attachment
  let attachment = "";
  if (req.file) {
    attachment = req.file.filename || "";
  } else if (req.body && req.body.attachment) {
    // attachment might be an object (from some clients) — stringify it
    attachment =
      typeof req.body.attachment === "string"
        ? req.body.attachment
        : JSON.stringify(req.body.attachment);
  }

  const { subject, category, priority, message } = req.body;

  // Validate required fields
  if (!subject || !category || !priority || !message) {
    return res
      .status(400)
      .json({ error: "subject, category, priority and message are required" });
  }

  // Attempt to use Mongoose Ticket model if available, else fallback to SQL
  let TicketModel = null;
  try {
    // Require the guarded model file; it exports null if mongoose isn't installed
    TicketModel = require("../models/Ticket");
  } catch (e) {
    console.warn("Could not load Ticket model:", e.message || e);
    TicketModel = null;
  }

  if (TicketModel) {
    try {
      const ticketData = { subject, category, priority, message, attachment };
      if (req.userId) ticketData.user = req.userId;

      const ticket = await TicketModel.create(ticketData);
      return res.status(201).json(ticket);
    } catch (error) {
      console.error("Support ticket error:", error);
      return res
        .status(500)
        .json({ error: error.message || "Internal server error" });
    }
  }

  // Fallback to MySQL insertion (existing behavior)
  try {
    const userId = req.userId || null;
    const sql = `
        INSERT INTO support_tickets (user_id, subject, category, message, status, priority, attachment)
        VALUES (?, ?, ?, ?, 'open', ?, ?)
    `;

    pool.query(
      sql,
      [userId, subject, category, message, priority, attachment],
      (error, results) => {
        if (error) {
          console.error("Error creating support ticket (SQL):", error);
          return res.status(500).json({
            error: "An error occurred while creating the support ticket",
          });
        }

        return res.status(201).json({
          message: "Support ticket created successfully",
          ticketId: results.insertId,
        });
      },
    );
  } catch (err) {
    console.error("Support ticket fallback error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Internal server error" });
  }
};

module.exports = {
  getAllUsers,
  AllUsersWithRoles,
  checkEmail,
  signup,
  login,
  getUserById,
  updateUser,
  resetPassword,
  resetPasswordByEmail,
  resetPasswordConfirm,
  deleteUser,
  requestSalaryAdvance,
  getUserDetails,
  getUserByStaffNumber,
  createSupportTicket,
};
