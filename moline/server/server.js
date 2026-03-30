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
const financeRoutes = require("./routes/financeRoutes");
const roleRoutes = require("./routes/roleRoutes");
const reportRoutes = require("./routes/reportRoutes");
const staffRoutes = require("./routes/staffRoutes");
const formRoutes = require("./routes/formRoutes");

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
app.use("/api/finance", financeRoutes);
app.use("/api/matatus", matatuRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/staff", staffRoutes);
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
