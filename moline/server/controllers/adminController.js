const { pool } = require('../config/database');
const { sendApprovalEmail, sendDisapprovalEmail } = require('../utils/mailer');

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
            u.created_at,
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

module.exports = {
    getApprovedUsers,
    getPendingUsers,
    approveUser,
    disapproveUser,
};
