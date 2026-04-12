const { pool } = require("../config/database");
const { sendApprovalEmail, sendDisapprovalEmail } = require("../utils/mailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { secretKey } = process.env;

const buildUserResponse = async (userId) => {
  const rows = await new Promise((resolve, reject) => {
    pool.query(
      `
        SELECT user_id, first_name, last_name, email, phone, ID_image, status
        FROM Users
        WHERE user_id = ?
        LIMIT 1
      `,
      [userId],
      (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results || []);
      },
    );
  });

  if (!rows.length) {
    return null;
  }

  const user = rows[0];
  return {
    ...user,
    ID_image: user.ID_image
      ? `http://localhost:5000/uploads/${user.ID_image}`
      : null,
  };
};

const getApprovedUsers = (req, res) => {
  const sql = `
        SELECT 
            u.user_id, 
            u.first_name, 
            u.last_name, 
            u.email, 
            u.ID_image,
            u.phone,
            u.status,
            COALESCE(GROUP_CONCAT(r.role_name), '') AS roles
        FROM 
            Users u
        LEFT JOIN 
            user_role ur ON u.user_id = ur.user_id
        LEFT JOIN 
            roles r ON ur.role_id = r.role_id
        WHERE 
          LOWER(u.status) = 'approved'
        GROUP BY 
            u.user_id
    `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching approved users:", err);
      res
        .status(500)
        .json({ error: "An error occurred while fetching approved users" });
      return;
    }

    const usersWithImageURLs = results.map((user) => ({
      ...user,
      ID_image: user.ID_image
        ? `http://localhost:5000/uploads/${user.ID_image}`
        : null,
    }));

    res.json(usersWithImageURLs);
  });
};

const getPendingUsers = (req, res) => {
  const sql =
    'SELECT user_id, first_name, last_name, email, ID_image, status FROM Users WHERE LOWER(status) = "pending"';
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ error: "An error occurred while fetching users" });
      return;
    }
    const usersWithImageURLs = results.map((user) => ({
      ...user,
      ID_image: user.ID_image
        ? `http://localhost:5000/uploads/${user.ID_image}`
        : null,
    }));
    res.json(usersWithImageURLs);
  });
};

const approveUser = (req, res) => {
  const { userId, userEmail, email } = req.body;
  const sql = 'UPDATE Users SET status = "approved" WHERE user_id = ?';
  pool.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error approving user:", err);
      res
        .status(500)
        .json({ error: "An error occurred while approving the user" });
      return;
    }
    if (!results || results.affectedRows === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const recipientEmail = userEmail || email;
    if (recipientEmail) {
      sendApprovalEmail(recipientEmail); // Send approval email
    }

    buildUserResponse(userId)
      .then((user) => {
        res.json({
          success: true,
          message: "User approved successfully",
          status: "approved",
          user,
        });
      })
      .catch((lookupError) => {
        console.error("Error loading approved user:", lookupError);
        res.json({
          success: true,
          message: "User approved successfully",
          status: "approved",
        });
      });
  });
};

const disapproveUser = (req, res) => {
  const { userId, userEmail, email } = req.body;
  const sql = 'UPDATE Users SET status = "pending" WHERE user_id = ?';
  pool.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error disapproving user:", err);
      res
        .status(500)
        .json({ error: "An error occurred while disapproving the user" });
      return;
    }
    if (!results || results.affectedRows === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const recipientEmail = userEmail || email;
    if (recipientEmail) {
      sendDisapprovalEmail(recipientEmail); // Send disapproval email
    }

    buildUserResponse(userId)
      .then((user) => {
        res.json({
          success: true,
          message: "User moved back to pending successfully",
          status: "pending",
          user,
        });
      })
      .catch((lookupError) => {
        console.error("Error loading pending user:", lookupError);
        res.json({
          success: true,
          message: "User moved back to pending successfully",
          status: "pending",
        });
      });
  });
};

const adminLogin = (req, res) => {
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
        };

        const token = jwt.sign(userResponse, secretKey, { expiresIn: "12h" });
        res.json({ message: "Login successful", user: userResponse, token });
      }
    }
  });
};

const getAllUserSavings = (req, res) => {
  const sql = `
        SELECT 
            u.user_id,
            CONCAT(u.first_name, ' ', u.last_name) AS name,
            u.email,
            u.phone,
            COALESCE(SUM(s.amount), 0) AS totalSavings
        FROM 
            users u
        LEFT JOIN 
            savings s ON s.user_id = u.user_id OR s.matatu_id IN (SELECT m.matatu_id FROM matatus m WHERE m.owner_id = u.user_id)
        GROUP BY 
            u.user_id, u.first_name, u.last_name, u.email, u.phone
        ORDER BY 
            u.user_id
    `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching user savings:", err);
      res
        .status(500)
        .json({ error: "An error occurred while fetching user savings" });
      return;
    }

    const usersWithSavings = results.map((user) => ({
      userId: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      totalSavings: user.totalSavings,
      savingsLabel:
        user.totalSavings > 0 ? `KSh ${user.totalSavings}` : "NIL SAVINGS",
    }));

    res.json(usersWithSavings);
  });
};

const getSupportTickets = (req, res) => {
  const sql = `
        SELECT
            st.id,
            st.user_id,
            COALESCE(CONCAT(u.first_name, ' ', u.last_name), 'Unknown User') AS user_name,
            u.email,
            u.phone,
            st.subject,
            st.category,
            st.priority,
            st.message,
            st.status,
            st.attachment,
            st.created_at,
            st.updated_at
        FROM support_tickets st
        LEFT JOIN Users u ON st.user_id = u.user_id
        ORDER BY st.created_at DESC, st.id DESC
    `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching support tickets:", err);
      res
        .status(500)
        .json({ error: "An error occurred while fetching support tickets" });
      return;
    }

    const supportTickets = results.map((ticket) => ({
      ...ticket,
      attachment: ticket.attachment
        ? `http://localhost:5000/uploads/${ticket.attachment}`
        : null,
    }));

    res.json(supportTickets);
  });
};

module.exports = {
  getApprovedUsers,
  getPendingUsers,
  approveUser,
  disapproveUser,
  adminLogin,
  getAllUserSavings,
  getSupportTickets,
};
