const { pool } = require('../config/database');
const { userRoles } = require('./roleController');

const getUserDetails = (req, res) => {
    const userId = req.userId;

    if (!userId) {
        res.status(400).json({ error: 'User ID not provided' });
        return;
    }
    console.log("userId:", req.userId)
    const sql = `
        SELECT u.first_name, s.position
        FROM users u
        JOIN staffdetails s ON u.user_id = s.user_id
        WHERE u.user_id = ?
    `;

    pool.query(sql, [userId], (error, results) => {
        if (error) {
            console.error('Error fetching user details:', error);
            res.status(500).json({ error: 'An unexpected error occurred' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(results[0]);
    });
};

const saveStaffDetails = async (req, res) => {
    const userId = req.userId;
    const { bankName, accountNumber, kraPin, nhifNumber, branch } = req.body; 
    const passportPhoto = req.file ? req.file.filename : null;

    // Ensure that none of the required fields are null or undefined
    if (!bankName || !accountNumber || !kraPin || !nhifNumber || !branch) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        const query = `
            INSERT INTO staffdetails (user_id, bank_name, bank_account_number, kra_pin, nhif_number, passport_photo) 
            VALUES (?, ?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
                bank_name = VALUES(bank_name), 
                bank_account_number = VALUES(bank_account_number), 
                kra_pin = VALUES(kra_pin), 
                nhif_number = VALUES(nhif_number), 
                passport_photo = IFNULL(VALUES(passport_photo), passport_photo)
        `;

        await pool.query(query, [userId, bankName, accountNumber, kraPin, nhifNumber, passportPhoto]);

        res.json({ message: 'Details saved successfully' });
    } catch (error) {
        console.error('Error saving details:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
};


const getStaffDetails = async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        console.log('Unauthorized');
    }
    const sql = `
        SELECT 
            u.*, 
            s.bank_account_number, s.bank_name, s.branch, s.kra_pin, s.nhif_number, s.passport_photo
        FROM 
            users u
        LEFT JOIN 
            staffdetails s
        ON 
            u.user_id = s.user_id
        WHERE 
            u.user_id = ?
    `;

    pool.query(sql, [userId], (error, results) => {
        if (error) {
            console.error('Error fetching user and staff details:', error);
            res.status(500).json({ error: 'An unexpected error occurred' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(results[0]);
    });
};

const getSalary = (req, res) => {
    const userId = req.userId;

    if (!userId) {
        res.status(400).json({ error: 'User ID not provided' });
        return;
    }

    const sql = 'SELECT salary FROM staffdetails WHERE user_id = ?';

    pool.query(sql, [userId], (error, results) => {
        if (error) {
            console.error('Error fetching salary:', error);
            res.status(500).json({ error: 'An unexpected error occurred' });
            return;
        }

        if (!results || results.length === 0 || results[0].salary === undefined) {
            res.status(404).json({ error: 'Salary information not available' });
            return;
        }

        res.json({ salary: results[0].salary });
    });
};


const getUserPosition = (req, res) => {
    const userId = req.userId;

    if (!userId) {
        res.status(400).json({ error: 'User ID not provided' });
        return;
    }

    const sql = `
        SELECT position
        FROM staffdetails
        WHERE user_id = ?
    `;

    pool.query(sql, [userId], (error, results) => {
        if (error) {
            console.error('Error fetching user position:', error);
            res.status(500).json({ error: 'An unexpected error occurred' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(results[0]);
    });
};


const getAllStaffDetails = async (req, res) => {
    try {
        const results = await pool.query('SELECT * FROM staffdetails');
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getSalaryAdvanceApplications = async (req, res) => {
    try {
        const response = await pool.query('SELECT * FROM expenses where expense_type = "salaryAdvance"');
        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateStaffDetails = (req, res) => {
    const userId = req.userId;
    const { bank_name, bank_account_number, nhif_number } = req.body;

    // Validate if all required fields are present
    if (!bank_name || !bank_account_number || !nhif_number) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = `
        UPDATE staffdetails
        SET bank_name = ?, bank_account_number = ?, nhif_number = ?
        WHERE user_id = ?
    `;

    pool.query(
        sql,
        [bank_name, bank_account_number, nhif_number, userId],
        (error, results) => {
            if (error) {
                console.error('Error updating staff details:', error);
                return res.status(500).json({ error: 'An unexpected error occurred' });
            }
            res.json({ message: 'Staff details updated successfully' });
        }
    );
};

const fetchStaffDetailsById = async (req, res) => {
    try {
        const userId = req.params.userId;
        const result = await pool.query('SELECT * FROM staffdetails WHERE user_id = ?', [userId]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching staff details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const fetchUserDetailsById = async (req, res) => {
    try {
        const userId = req.params.userId;
        const result = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const applyExpense = async (req, res) => {
    const userId = req.userId;
    const { expenseType, amount } = req.body;

    if (!expenseType || !amount) {
        return res.status(400).json({ error: 'Expense type and amount are required' });
    }

    try {
        // Check if user is applying for a salary advance and has an existing pending advance
        if (expenseType === 'salaryAdvance' && userId) {
            const [existingAdvance] = await pool.query(
                `SELECT * FROM expenses WHERE user_id = ? AND expense_type = 'salaryAdvance' `,
                [userId]
            );

            if (existingAdvance.length > 0) {
                return res.status(400).json({ error: 'You already have a pending salary advance application' });
            }
        }

        let sql;
        let values;

        if (userId) {
            sql = `
                INSERT INTO expenses (user_id, expense_type, amount, date, status)
                VALUES (?, ?, ?, NOW(), 'pending')
            `;
            values = [userId, expenseType, amount];
        } else {
            sql = `
                INSERT INTO expenses (expense_type, amount, date, status)
                VALUES (?, ?, NOW(), 'pending')
            `;
            values = [expenseType, amount];
        }

        await pool.query(sql, values);
        res.json({ message: 'Expense recorded successfully' });
    } catch (error) {
        console.error('Error recording expense:', error);
        return res.status(500).json({ error: 'An error occurred while recording the expense' });
    }
};


const getExpenses = async (req, res) => {
    const userId = req.userId; 
    if (!userId) {
        console.log('Unauthorized');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const sql = `
        SELECT expense_id, expense_type, amount, date
        FROM expenses
        WHERE user_id = ?
    `;

    try {
        const [expenses, fields] = await pool.query(sql, [userId]);
        res.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
};

const getAllExpenses = async (req, res) => {
    try {
        const userExpensesQuery = `
            SELECT e.expense_id, e.expense_type, e.amount, e.date, u.first_name AS user_name
            FROM expenses e
            LEFT JOIN users u ON e.user_id = u.user_id
            WHERE e.expense_type IN ('salary', 'salaryAdvance')
        `;
        const generalExpensesQuery = `
            SELECT expense_id, expense_type, amount, date
            FROM expenses
            WHERE expense_type NOT IN ('salary', 'salaryAdvance')
        `;

        // Fetch results from the database
        const [userExpensesResults] = await pool.query(userExpensesQuery);
        const [generalExpensesResults] = await pool.query(generalExpensesQuery);
        // Ensure results are arrays
        const userExpenses = Array.isArray(userExpensesResults) ? userExpensesResults : [];
        const generalExpenses = Array.isArray(generalExpensesResults) ? generalExpensesResults : [];

        // Send the response
        res.json({
            salaryExpenses: userExpenses,
            otherExpenses: generalExpenses
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ error: 'An error occurred while fetching expenses' });
    }
};
const checkSalaryAdvance = async (req, res) => {
    const userId = req.userId; 
    console.log("user:", userId);
    try {
        const query = `
            SELECT * FROM expenses 
            WHERE user_id = ? 
              AND expense_type = 'salaryAdvance' 
              AND MONTH(date) = MONTH(CURRENT_DATE()) 
              AND YEAR(date) = YEAR(CURRENT_DATE())
              AND status IN ('pending', 'approved')`;

        pool.query(query, [userId], (error, results) =>{
            if (error) {
                console.error('Error checking user:', error);
                res.status(500).json({ error: 'An error occurred while checking user' });
                return;
            }
            res.json({ exists: results.length > 0 });
        });

        // Check if any results are returned
        // if (rows.length > 0) {
        //     res.json({ exists: true, advance: rows[0] }); 
        //     res.json({ exists: results.length > 0 });
        // } else {
        //     res.json({ exists: false }); 
        // }
    } catch (error) {
        console.error('Error querying database:', error);
        throw new Error('Database query failed');
    }
};

module.exports = {
    getUserDetails,
    saveStaffDetails,
    getStaffDetails,
    getSalary,
    getUserPosition,
    getAllStaffDetails,
    getSalaryAdvanceApplications,
    updateStaffDetails,
    fetchStaffDetailsById,
    applyExpense,
    getExpenses,
    fetchUserDetailsById,
    getAllExpenses,
    checkSalaryAdvance
};
