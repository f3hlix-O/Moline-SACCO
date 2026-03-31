const { pool } = require('../config/database');
const { sendApprovalEmail, sendDisapprovalEmail } = require('../utils/mailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {secretKey} = process.env;

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
            u.status = 'approved'
        GROUP BY 
            u.user_id
    `;

    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching approved users:', err);
            res.status(500).json({ error: 'An error occurred while fetching approved users' });
            return;
        }

        const usersWithImageURLs = results.map(user => ({
            ...user,
            ID_image: user.ID_image ? `http://localhost:5000/uploads/${user.ID_image}` : null,
        }));
        
        res.json(usersWithImageURLs);
    });
};

const getPendingUsers = (req, res) => {
    const sql = 'SELECT user_id, first_name, last_name, email, ID_image FROM Users WHERE status = "pending"';
    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ error: 'An error occurred while fetching users' });
            return;
        }
        const usersWithImageURLs = results.map(user => ({
            ...user,
            ID_image: user.ID_image ? `http://localhost:5000/uploads/${user.ID_image}` : null,
        }));
        res.json(usersWithImageURLs);
    });
};

const approveUser = (req, res) => {
    const { userId, userEmail } = req.body;
    const sql = 'UPDATE Users SET status = "approved" WHERE user_id = ?';
    pool.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error approving user:', err);
            res.status(500).json({ error: 'An error occurred while approving the user' });
            return;
        }
        sendApprovalEmail(userEmail); // Send approval email
        res.json({ message: 'User approved successfully' });
    });
};

const disapproveUser = (req, res) => {
    const { userId, userEmail } = req.body;
    const sql = 'UPDATE Users SET status = "disapproved" WHERE user_id = ?';
    pool.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error disapproving user:', err);
            res.status(500).json({ error: 'An error occurred while disapproving the user' });
            return;
        }
        sendDisapprovalEmail(userEmail); // Send disapproval email
        res.json({ message: 'User disapproved successfully' });
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

module.exports = {
    getApprovedUsers,
    getPendingUsers,
    approveUser,
    disapproveUser,
    adminLogin,
};
