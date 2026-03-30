const { pool } = require('../config/database');

const roles = (req, res) => {
    const sql = 'SELECT * FROM roles';
    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching roles:', err);
            res.status(500).json({ error: 'An error occurred while fetching roles' });
            return;
        }
        res.json(results);
    });
};

const userRoles = (req, res) => {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: 'Invalid user IDs' });
    }

    const placeholders = userIds.map(() => '?').join(',');
    const sql = `
        SELECT ur.user_id, r.role_name
        FROM user_role ur
        JOIN roles r ON ur.role_id = r.role_id
        WHERE ur.user_id IN (${placeholders})
    `;

    pool.query(sql, userIds, (err, results) => {
        if (err) {
            console.error('Error fetching user roles:', err);
            return res.status(500).json({ error: 'An error occurred while fetching user roles' });
        }
        res.json(results);
    });
};

const assignRole = (req, res) => {
    const { userId } = req.params;
    const { roleId } = req.body;
    const sql = 'INSERT INTO user_role (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE role_id = ?';
    const values = [userId, roleId, roleId];
    pool.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error assigning role:', err);
            res.status(500).json({ error: 'An error occurred while assigning the role' });
            return;
        }
        res.json({ message: 'Role assigned successfully' });
    });
};

module.exports = {
    roles,
    userRoles,
    assignRole,
};