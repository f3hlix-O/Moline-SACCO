require("dotenv").config();

const mysql = require("mysql");
const util = require("util");

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

const rawQuery = pool.query.bind(pool);
pool.query = (sql, values, callback) => {
  if (typeof values === "function") {
    callback = values;
    values = undefined;
  }

  if (typeof callback === "function") {
    return rawQuery(sql, values, callback);
  }

  return util.promisify(rawQuery)(sql, values);
};

const connectDB = async () => {
  try {
    const connection = await pool.query("SELECT 1");
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
};

module.exports = { pool, connectDB };
