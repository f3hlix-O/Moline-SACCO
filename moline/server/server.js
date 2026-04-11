require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const { connectDB, pool } = require("./config/database");

const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const matatuRoutes = require("./routes/matatuRoutes");
const driverRoutes = require("./routes/driverRoutes");
const financeRoutes = require("./routes/financeRoutes");
const roleRoutes = require("./routes/roleRoutes");
const reportRoutes = require("./routes/reportRoutes");
const staffRoutes = require("./routes/staffRoutes");
const formRoutes = require("./routes/formRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const port = process.env.PORT || 5000;
// Forms route will be registered with other routes (after middleware)
const secretKey = process.env.SESSION_SECRET;

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Also enable express.json middleware (safe if bodyParser already used)
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    key: "my_app_session",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 1 * 1,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    },
  }),
);

const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
// Serve uploads and client static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/reports", express.static(path.join(__dirname, "reports")));

// Serve client build or public folder as static assets (must be before routes)
const clientBuildPath = path.join(__dirname, "..", "client", "build");
const clientPublicPath = path.join(__dirname, "..", "client", "public");
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
} else {
  app.use(express.static(clientPublicPath));
}

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// setTimeout() => {
//   console.log("Delayed log: This message appears after a 5-second delay.");
// }

app.use("/api/finance", financeRoutes);
app.use("/api/matatus", matatuRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
// Forms (exit/withdrawal) endpoint
app.use("/api/forms", formRoutes);

// Generic error handler (captures multer and other errors) and returns JSON
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err && (err.stack || err.message || err));
  if (err && (err.name === "MulterError" || err.code === "LIMIT_FILE_SIZE")) {
    return res.status(400).json({ error: err.message || "File upload error" });
  }
  return res
    .status(500)
    .json({ error: err && (err.message || "Internal server error") });
});

// If a static asset is requested but not found, log and return 404 (avoid returning HTML)
app.use((req, res, next) => {
  const ext = path.extname(req.path);
  if (ext) {
    console.warn(`Static asset not found: ${req.originalUrl}`);
    return res.status(404).send("Not Found");
  }
  next();
});

// SPA fallback: serve React app index.html for non-API requests (only when build exists)
if (fs.existsSync(clientBuildPath)) {
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) return res.status(404).send("Not Found");
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
} else {
  // No build available; return 404 for unknown non-asset, non-API routes
  app.use((req, res) => {
    res.status(404).send("Not Found");
  });
}

const startServer = async () => {
  try {
    await connectDB();
    // Ensure reset token columns exist on Users table (adds columns if missing)
    try {
      const colToken = await pool.query(
        "SHOW COLUMNS FROM Users LIKE 'reset_token'",
      );
      if (!colToken || colToken.length === 0) {
        console.log("Adding reset_token column to Users table");
        await pool.query(
          "ALTER TABLE Users ADD COLUMN reset_token VARCHAR(255) NULL",
        );
      }
      const colExpiry = await pool.query(
        "SHOW COLUMNS FROM Users LIKE 'reset_token_expires'",
      );
      if (!colExpiry || colExpiry.length === 0) {
        console.log("Adding reset_token_expires column to Users table");
        await pool.query(
          "ALTER TABLE Users ADD COLUMN reset_token_expires BIGINT NULL",
        );
      }
    } catch (err) {
      console.error(
        "Could not ensure reset token columns exist:",
        err.message || err,
      );
    }

    try {
      const driversTableSql = `
        CREATE TABLE IF NOT EXISTS drivers (
          driver_id INT NOT NULL AUTO_INCREMENT,
          owner_id INT NOT NULL,
          vehicle_id INT NULL DEFAULT NULL,
          full_name VARCHAR(255) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          national_id VARCHAR(50) NOT NULL,
          license_number VARCHAR(100) NOT NULL,
          license_expiry_date DATE NOT NULL,
          address VARCHAR(255) NOT NULL,
          status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (driver_id),
          UNIQUE KEY uniq_driver_national_id (national_id),
          UNIQUE KEY uniq_driver_license_number (license_number),
          UNIQUE KEY uniq_driver_vehicle_id (vehicle_id),
          KEY idx_driver_owner_id (owner_id),
          CONSTRAINT fk_drivers_owner_id FOREIGN KEY (owner_id) REFERENCES Users(user_id) ON DELETE CASCADE,
          CONSTRAINT fk_drivers_vehicle_id FOREIGN KEY (vehicle_id) REFERENCES matatus(matatu_id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await pool.query(driversTableSql);
      console.log("Ensured drivers table exists");
    } catch (drvErr) {
      console.error(
        "Could not create/ensure drivers table:",
        drvErr && drvErr.message ? drvErr.message : drvErr,
      );
    }

    try {
      const withdrawalsTableSql = `
        CREATE TABLE IF NOT EXISTS withdrawals (
          withdrawal_id INT NOT NULL AUTO_INCREMENT,
          user_id INT NOT NULL,
          user_name VARCHAR(255) NOT NULL,
          amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          reason TEXT NOT NULL,
          vehicle_reference VARCHAR(255) NULL DEFAULT NULL,
          account_reference VARCHAR(255) NULL DEFAULT NULL,
          status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
          submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (withdrawal_id),
          KEY idx_withdrawals_user_id (user_id),
          CONSTRAINT fk_withdrawals_user_id FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await pool.query(withdrawalsTableSql);
      await pool.query(`
        ALTER TABLE withdrawals
          DROP FOREIGN KEY fk_withdrawals_user_id,
          MODIFY user_id INT NULL,
          ADD CONSTRAINT fk_withdrawals_user_id
            FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL
      `);
      console.log("Ensured withdrawals table exists");
    } catch (withdrawalErr) {
      console.error(
        "Could not create/ensure withdrawals table:",
        withdrawalErr && withdrawalErr.message
          ? withdrawalErr.message
          : withdrawalErr,
      );
    }

    // Ensure uploads directory exists at server start
    try {
      const fs = require("fs");
      const path = require("path");
      const serverUploads = path.join(__dirname, "uploads");
      if (!fs.existsSync(serverUploads)) {
        fs.mkdirSync(serverUploads, { recursive: true });
        console.log("Created uploads directory:", serverUploads);
      }
    } catch (dErr) {
      console.warn(
        "Could not ensure uploads directory exists:",
        dErr && dErr.message ? dErr.message : dErr,
      );
    }

    // Ensure support_tickets table exists (safe, idempotent)
    try {
      const supportTableSql = `
        CREATE TABLE IF NOT EXISTS support_tickets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NULL,
          subject VARCHAR(255) NOT NULL,
          category VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          status ENUM('open','closed','pending') DEFAULT 'open',
          priority ENUM('Low','Medium','High') DEFAULT 'Medium',
          attachment VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await pool.query(supportTableSql);
      console.log("Ensured support_tickets table exists");
    } catch (tblErr) {
      console.error(
        "Could not create/ensure support_tickets table:",
        tblErr && tblErr.message ? tblErr.message : tblErr,
      );
    }

    // Ensure loans table has required columns for repayments (safe, idempotent)
    try {
      const columnsToAdd = [
        {
          name: "status",
          sql: "ALTER TABLE loans ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending'",
        },
        {
          name: "repayment_months",
          sql: "ALTER TABLE loans ADD COLUMN repayment_months INT NULL",
        },
        {
          name: "monthly_installment",
          sql: "ALTER TABLE loans ADD COLUMN monthly_installment DECIMAL(13,2) NULL",
        },
        {
          name: "disbursement_date",
          sql: "ALTER TABLE loans ADD COLUMN disbursement_date DATETIME NULL",
        },
        {
          name: "next_due_date",
          sql: "ALTER TABLE loans ADD COLUMN next_due_date DATETIME NULL",
        },
        {
          name: "final_due_date",
          sql: "ALTER TABLE loans ADD COLUMN final_due_date DATETIME NULL",
        },
        {
          name: "outstanding_balance",
          sql: "ALTER TABLE loans ADD COLUMN outstanding_balance DECIMAL(13,2) NULL",
        },
        {
          name: "repayment_status",
          sql: "ALTER TABLE loans ADD COLUMN repayment_status VARCHAR(50) NULL",
        },
        {
          name: "auto_deduction_enabled",
          sql: "ALTER TABLE loans ADD COLUMN auto_deduction_enabled TINYINT(1) NOT NULL DEFAULT 0",
        },
        {
          name: "rejection_reason",
          sql: "ALTER TABLE loans ADD COLUMN rejection_reason TEXT NULL",
        },
      ];

      for (const col of columnsToAdd) {
        const checkQuery = await pool.query(
          "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'loans' AND column_name = ?",
          [col.name],
        );
        const checkRows =
          Array.isArray(checkQuery) && Array.isArray(checkQuery[0])
            ? checkQuery[0]
            : checkQuery;
        if (checkRows && checkRows.length > 0 && checkRows[0].count == 0) {
          await pool.query(col.sql);
        }
      }
      console.log("Ensured loans table has repayment columns");
    } catch (loansErr) {
      console.error(
        "Could not ensure loans table columns:",
        loansErr && loansErr.message ? loansErr.message : loansErr,
      );
    }

    // Ensure loan_installments table exists (safe, idempotent)
    try {
      const loanInstallmentsSql = `
        CREATE TABLE IF NOT EXISTS loan_installments (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          loan_id INT NOT NULL,
          user_id INT NULL,
          installment_number INT NULL,
          due_date DATETIME NOT NULL,
          amount DECIMAL(13,2) NOT NULL,
          paid_amount DECIMAL(13,2) DEFAULT 0,
          status ENUM('pending','processing','paid','failed','overdue') DEFAULT 'pending',
          paid_at DATETIME NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (loan_id) REFERENCES loans(loan_id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
          INDEX idx_loan_installments_due (due_date, status),
          INDEX idx_loan_installments_loan (loan_id),
          INDEX idx_loan_installments_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await pool.query(loanInstallmentsSql);
      console.log("Ensured loan_installments table exists");
    } catch (liErr) {
      console.error(
        "Could not create/ensure loan_installments table:",
        liErr && liErr.message ? liErr.message : liErr,
      );
    }

    // Initialize auto-deduction after schema is ready
    try {
      const { initAutoDeduction } = require("./controllers/financeController");
      await initAutoDeduction();
    } catch (initErr) {
      console.error(
        "Could not initialize auto-deduction:",
        initErr && initErr.message ? initErr.message : initErr,
      );
    }
  } catch (error) {
    console.error(
      "Database connection failed (continuing to start server):",
      error.message,
    );
  }

  app.listen(port, "0.0.0.0", () =>
    console.log(`Server running at http://localhost:${port}`),
  );
};

startServer();
