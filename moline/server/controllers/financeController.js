require("dotenv").config();
const { pool } = require("../config/database");
const axios = require("axios");
const util = require("util");
const {
  shareholderCapitalPaymentEmail,
  sendLoanApprovedEmail,
  sendLoanDisapprovedEmail,
} = require("../utils/mailer");

// In-memory cache to avoid noisy logs for repeated polls
const paymentStatusCache = new Map();
const baseUrl = process.env.MPESA_BASE_URL;
const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const shortcode = process.env.MPESA_SHORTCODE;
const PassKey = process.env.MPESA_PASSKEY;
const callbackUrl = process.env.MPESA_CALLBACK_URL;

// ---------------- MPESA Utilities ----------------
const getMpesaAccessToken = async () => {
  try {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
      "base64",
    );
    const url = `${(baseUrl || "").replace(/\/$/, "")}/oauth/v1/generate?grant_type=client_credentials`;
    console.log("MPESA OAuth URL:", url);
    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 10000,
    });
    return response.data?.access_token;
  } catch (err) {
    console.error(
      "Failed to get MPESA access token:",
      err.response?.data || err.message || err,
    );
    throw err;
  }
};

const getTimestamp = () => {
  const date = new Date();
  return (
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0") +
    String(date.getHours()).padStart(2, "0") +
    String(date.getMinutes()).padStart(2, "0") +
    String(date.getSeconds()).padStart(2, "0")
  );
};

// Normalize Kenyan phone numbers to international format without plus.
// Returns normalized string like '254712345678' or null if invalid.
const normalizeKenyanPhoneNumber = (raw) => {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim();
  // remove spaces, parentheses and dashes
  s = s.replace(/[\s()\-]/g, "");
  // strip leading + if present
  if (s.startsWith("+")) s = s.slice(1);
  if (!/^\d+$/.test(s)) return null;
  // local formats: 07xxxxxxxx or 01xxxxxxxx
  if (/^0(7|1)\d{8}$/.test(s)) return `254${s.slice(1)}`;
  // international without plus: 2547xxxxxxxx or 2541xxxxxxxx
  if (/^254(7|1)\d{8}$/.test(s)) return s;
  return null;
};

// Backwards-compatible wrapper: tries to normalize, otherwise return input
const convertPhoneNumber = (phone) => {
  const n = normalizeKenyanPhoneNumber(phone);
  return n || phone;
};

const initiateMpesaSTKPush = async (
  phone,
  amount,
  accountNumber,
  options = {},
) => {
  const { userId = null, matatu_id = null } = options;
  const accessToken = await getMpesaAccessToken();
  const timestamp = getTimestamp();
  const password = Buffer.from(`${shortcode}${PassKey}${timestamp}`).toString(
    "base64",
  );
  // Normalize incoming phone number to expected MPESA format (no leading +)
  const normalizedPhone = normalizeKenyanPhoneNumber(phone);
  if (!normalizedPhone) {
    throw new Error("Invalid phone number");
  }
  const internationalPhone = normalizedPhone;

  const callback =
    callbackUrl ||
    `${(baseUrl || "").replace(/\/$/, "")}/api/finance/mpesaCallback`;

  const requestBody = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: internationalPhone,
    PartyB: shortcode,
    PhoneNumber: internationalPhone,
    CallBackURL: callback,
    AccountReference: accountNumber,
    TransactionDesc: "Payment for matatu operations",
  };

  try {
    const url = `${(baseUrl || "").replace(/\/$/, "")}/mpesa/stkpush/v1/processrequest`;
    console.log("MPESA STK Push URL:", url);
    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });
    const data = response.data || {};

    // Attempt to extract CheckoutRequestID
    const checkoutId =
      data.CheckoutRequestID || data.Response?.CheckoutRequestID || null;

    if (checkoutId) {
      try {
        // Insert a provisional payment record so we can track status by CheckoutRequestID
        const paymentId = generatePaymentId();
        // Save provisional payment row with status 'pending' and the requested amount
        // NOTE: Ensure the `payments` table has a `status` varchar column (pending/success/failed)
        const insertSql = `INSERT INTO payments (payment_id, user_id, matatu_id, amount_paid, transaction_code, operations, insurance, loan, savings, CheckoutRequestID, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const insertValues = [
          paymentId.toString(),
          userId || 0,
          matatu_id || 0,
          amount, // store intended amount so frontend can correlate
          "", // transaction_code placeholder
          0, // operations
          0, // insurance
          0, // loan
          0, // savings
          checkoutId,
          "success",
        ];
        await pool.query(insertSql, insertValues);
        // initialize cache entry
        paymentStatusCache.set(checkoutId, "success");
        console.log(
          "Saved provisional payment with CheckoutRequestID:",
          checkoutId,
        );
      } catch (dbErr) {
        console.error(
          "Failed to save provisional payment for CheckoutRequestID:",
          checkoutId,
          dbErr,
        );
        // don't throw - we still want to return CheckoutRequestID to frontend
      }
    } else {
      console.warn(
        "No CheckoutRequestID returned from MPESA STK Push response",
        data,
      );
    }

    // Return the original response data (includes CheckoutRequestID)
    return data;
  } catch (error) {
    console.error(
      "Error initiating MPESA STK Push:",
      error.response?.data || error.message || error,
    );
    throw error;
  }
};

// ---------------- Helper Functions ----------------
const generatePaymentId = () => Date.now();

const getSavings = async (matatu_id) => {
  try {
    const query = `SELECT COALESCE(SUM(amount), 0) AS total_savings FROM savings WHERE matatu_id = ?`;
    const result = await pool.query(query, [matatu_id]);
    return result.length > 0 ? result[0].total_savings : 0;
  } catch (error) {
    console.error("Error fetching savings:", error);
    throw error;
  }
};

const getUserSavings = async (user_id) => {
  try {
    const query = `
      SELECT COALESCE(SUM(amount), 0) AS total_savings
      FROM savings
      WHERE user_id = ? OR matatu_id IN (SELECT matatu_id FROM matatus WHERE owner_id = ?)
    `;
    const result = await pool.query(query, [user_id, user_id]);
    return result.length > 0 ? result[0].total_savings : 0;
  } catch (error) {
    console.error("Error fetching user savings:", error);
    throw error;
  }
};

const checkOutstandingLoan = async (matatu_id) => {
  try {
    const query = "SELECT loan_id, amount_due FROM loans WHERE matatu_id = ?";
    const result = await pool.query(query, [matatu_id]);

    // pool.query with mysql2/promise returns [rows, fields]
    const rows =
      Array.isArray(result) && result.length > 0 ? result[0] : undefined;

    if (rows === undefined) {
      console.debug(
        "checkOutstandingLoan: query returned undefined for matatu_id:",
        matatu_id,
        "rawResult:",
        result,
      );
      // Keep return shape compatible with callers
      return { loan_id: null, amount_due: 0 };
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      // No outstanding loans found
      return { loan_id: null, amount_due: 0 };
    }

    return rows[0];
  } catch (error) {
    console.error("Error checking outstanding loan:", error);
    throw error;
  }
};

// ---------------- Repayment Helpers ----------------
const roundToTwo = (v) => {
  return Number(Number(v || 0).toFixed(2));
};

const toSqlDateTime = (d) => {
  const date = new Date(d);
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const DD = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
};

const addMonths = (d, months) => {
  const dt = new Date(d);
  const m = dt.getMonth();
  dt.setMonth(m + months);
  return dt;
};

/**
 * Safely parse repayment months from request / DB values.
 * Returns integer or null if not present.
 */
const parseRepaymentMonths = (value) => {
  if (value === undefined || value === null) return null;
  const p = parseInt(value, 10);
  return Number.isFinite(p) && p > 0 ? p : null;
};

/**
 * Create installment rows for a loan inside an existing DB connection.
 * connQuery is a promisified connection.query bound to the acquired connection.
 */
const createInstallments = async (
  connQuery,
  loanId,
  disbursementDate,
  repaymentMonths,
  monthlyAmount,
  userId = null,
) => {
  // ensure integer months
  const months = parseInt(repaymentMonths, 10) || 0;
  if (months <= 0) return;

  // Adjust last installment to account for rounding
  const installments = [];
  for (let i = 1; i <= months; i++) {
    const due = addMonths(disbursementDate, i);
    installments.push({ due_date: toSqlDateTime(due), amount: monthlyAmount });
  }

  // If loan_installments table exists, insert rows. If not, skip gracefully.
  try {
    // Try extended insert (with user_id and installment_number) for newer schemas
    const valuesExtended = installments.map((it, idx) => [
      loanId,
      userId,
      idx + 1,
      it.due_date,
      it.amount,
      0,
      "pending",
      null,
    ]);
    try {
      await connQuery(
        "INSERT INTO loan_installments (loan_id, user_id, installment_number, due_date, amount, paid_amount, status, paid_at) VALUES ?",
        [valuesExtended],
      );
    } catch (innerErr) {
      // Fallback: older schemas may not have user_id/installment_number
      const values = installments.map((it) => [
        loanId,
        it.due_date,
        it.amount,
        0,
        "pending",
        null,
      ]);
      await connQuery(
        "INSERT INTO loan_installments (loan_id, due_date, amount, paid_amount, status, paid_at) VALUES ?",
        [values],
      );
    }
  } catch (err) {
    if (err && err.code === "ER_NO_SUCH_TABLE") {
      // silent: older schemas will not have this table
      console.warn(
        "createInstallments: loan_installments table missing, skipping installment creation",
      );
    } else {
      throw err;
    }
  }
};

// ---------------- Controllers ----------------
const getTotalSavings = (req, res) => {
  const userId = req.userId;
  pool.query(
    "SELECT COALESCE(SUM(amount), 0) AS totalSavings FROM savings WHERE matatu_id IN (SELECT matatu_id FROM matatus WHERE user_id = ?)",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      res.json(results[0]);
    },
  );
};

const getLoans = (req, res) => {
  const { matatuId } = req.params;
  pool.query(
    "SELECT loan_id, loan_type, amount_issued, amount_due FROM loans WHERE matatu_id = ?",
    [matatuId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      res.json(results);
    },
  );
};

const getInsurance = (req, res) => {
  const { matatuId } = req.params;
  pool.query(
    "SELECT insurance_id, insurance_type, insurance_company, insurance_expiry FROM insurance WHERE matatu_id = ?",
    [matatuId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      res.json(results[0]);
    },
  );
};

const getPayments = (req, res) => {
  const { matatuId } = req.params;
  pool.query(
    "SELECT payment_id, amount_paid, transaction_code, payment_date FROM payments WHERE matatu_id = ?",
    [matatuId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      res.json(results);
    },
  );
};

const loanRequest = async (req, res) => {
  const userId = req.userId;
  const {
    matatu_id,
    matatuId: bodyMatatuId,
    loanAmount,
    loanType,
    guarantors,
  } = req.body;
  const matatuId = matatu_id || bodyMatatuId || null;
  // repaymentMonths may be provided as `repaymentMonths` or `repayment_months`
  const repaymentMonthsRaw =
    req.body.repaymentMonths || req.body.repayment_months;
  const repaymentMonths = parseRepaymentMonths(repaymentMonthsRaw);

  // Normalize and validate loan amount (use numeric comparisons)
  const parsedLoanAmount = Number(loanAmount);
  if (!loanType || !Number.isFinite(parsedLoanAmount))
    return res
      .status(400)
      .json({ error: "Missing required fields or invalid loan amount" });
  if (parsedLoanAmount <= 0)
    return res
      .status(400)
      .json({ error: "Loan amount must be greater than zero" });

  // For normal loans, matatu_id is required
  if (loanType === "normal" && !matatuId)
    return res.status(400).json({ error: "Normal loans require matatu_id" });

  // Validate repayment months for frontend-provided value
  if (repaymentMonths !== null) {
    if (loanType === "emergency") {
      if (repaymentMonths < 1 || repaymentMonths > 3)
        return res
          .status(400)
          .json({ error: "Emergency loans allow 1-3 months repayment" });
    } else if (loanType === "normal") {
      if (repaymentMonths < 1 || repaymentMonths > 6)
        return res
          .status(400)
          .json({ error: "Normal loans allow 1-6 months repayment" });
    }
  }

  // Fetch user's total savings and ensure savings record exists and covers the requested amount
  try {
    const sumRes = await pool.query(
      "SELECT COALESCE(SUM(amount),0) AS total_savings, COUNT(*) AS cnt FROM savings WHERE user_id = ?",
      [userId],
    );
    const sumRows =
      Array.isArray(sumRes) && Array.isArray(sumRes[0]) ? sumRes[0] : sumRes;
    const sumFirst = sumRows && sumRows[0] ? sumRows[0] : sumRows;
    const totalSavings = Number(sumFirst?.total_savings || 0);
    const recordCount = Number(sumFirst?.cnt || 0);

    if (!Number.isFinite(totalSavings) || recordCount === 0) {
      return res.status(400).json({
        error: "Loan amount cannot be greater than your savings balance.",
      });
    }

    if (parsedLoanAmount > totalSavings) {
      return res.status(400).json({
        error: "Loan amount cannot be greater than your savings balance.",
      });
    }
  } catch (sErr) {
    console.error("Error fetching user savings for loan validation:", sErr);
    return res.status(500).json({ error: "Internal server error" });
  }

  let parsedGuarantors = [];
  // parsedGuarantors will be filled for emergency loans below
  // Note: previous logic prevented multiple emergency loans; replaced by
  // combined-savings validation further down so users may apply again as
  // long as applicant + guarantor(s) savings cover the requested amount.
  if (loanType === "emergency") {
    if (!guarantors)
      return res
        .status(400)
        .json({ error: "Emergency loans require at least one guarantor" });
    try {
      parsedGuarantors = JSON.parse(guarantors);
    } catch (e) {
      return res.status(400).json({ error: "Invalid guarantors format" });
    }

    if (!Array.isArray(parsedGuarantors) || parsedGuarantors.length === 0) {
      return res
        .status(400)
        .json({ error: "Emergency loans require at least one guarantor" });
    }

    // Validate guarantor IDs exist and are not the applicant
    const ids = parsedGuarantors
      .map((id) => Number(id))
      .filter(Number.isFinite);
    if (ids.length !== parsedGuarantors.length)
      return res.status(400).json({ error: "Invalid guarantor ids" });

    try {
      const placeholders = ids.map(() => "?").join(",");
      const userRows = await pool.query(
        `SELECT user_id FROM Users WHERE user_id IN (${placeholders})`,
        ids,
      );
      const foundIds = Array.isArray(userRows)
        ? userRows.map((r) => r.user_id)
        : [];
      if (foundIds.length !== ids.length)
        return res.status(400).json({ error: "Some guarantors not found" });
      if (foundIds.includes(userId))
        return res
          .status(400)
          .json({ error: "Applicant cannot be a guarantor" });

      // Ensure guarantors do not have pending applications or outstanding loans
      try {
        let loanRows = [];
        try {
          const loanQuery = `SELECT user_id, SUM(CASE WHEN (amount_issued = 0 OR status = 'pending') THEN 1 ELSE 0 END) AS pending_count, SUM(CASE WHEN amount_due > 0 THEN 1 ELSE 0 END) AS outstanding_count FROM loans WHERE user_id IN (${placeholders}) GROUP BY user_id`;
          const loanRes = await pool.query(loanQuery, ids);
          loanRows = Array.isArray(loanRes) ? loanRes : [];
        } catch (loanQueryErr) {
          if (
            loanQueryErr.code === "ER_BAD_FIELD_ERROR" ||
            /status/.test(loanQueryErr.message || "")
          ) {
            const loanQuery = `SELECT user_id, SUM(CASE WHEN amount_issued = 0 THEN 1 ELSE 0 END) AS pending_count, SUM(CASE WHEN amount_due > 0 THEN 1 ELSE 0 END) AS outstanding_count FROM loans WHERE user_id IN (${placeholders}) GROUP BY user_id`;
            const loanRes = await pool.query(loanQuery, ids);
            loanRows = Array.isArray(loanRes) ? loanRes : [];
          } else {
            throw loanQueryErr;
          }
        }

        const invalid = (loanRows || [])
          .filter(
            (r) =>
              Number(r.pending_count) > 0 || Number(r.outstanding_count) > 0,
          )
          .map((r) => r.user_id);
        if (invalid.length > 0) {
          return res.status(400).json({
            error: `Guarantor(s) with user_id(s) ${invalid.join(", ")} have pending or outstanding loans and cannot be guarantors`,
          });
        }
      } catch (loanCheckErr) {
        console.error("Error checking guarantor loans:", loanCheckErr);
        return res.status(500).json({ error: "Internal server error" });
      }

      // Combined savings validation: ensure applicant + guarantors cover the requested emergency amount
      try {
        const applicantSavings = await getUserSavings(userId);
        // Sum guarantors' savings in a single query
        const sumRows = await pool.query(
          `SELECT COALESCE(SUM(amount), 0) AS total_savings FROM savings WHERE user_id IN (${placeholders})`,
          ids,
        );
        const guarantorsTotal =
          Array.isArray(sumRows) && sumRows[0]
            ? Number(sumRows[0].total_savings || 0)
            : 0;

        const EMERGENCY_CAP = 30000;
        if (Number(parsedLoanAmount) > EMERGENCY_CAP) {
          return res.status(400).json({
            error: `Emergency loan cannot exceed KES ${EMERGENCY_CAP}`,
          });
        }

        if (
          Number(applicantSavings) + Number(guarantorsTotal) <
          Number(parsedLoanAmount)
        ) {
          return res.status(400).json({
            error: `Applicant + guarantor(s) combined savings must be at least KES ${parsedLoanAmount}`,
          });
        }
      } catch (sErr) {
        console.error("Error checking combined savings:", sErr);
        return res.status(500).json({ error: "Internal server error" });
      }
    } catch (err) {
      console.error("Error validating guarantors:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  try {
    // Try to insert a loan record -- include repayment_months when provided.
    let insertResult;
    const repMonthsValue = repaymentMonths !== null ? repaymentMonths : null;
    try {
      // Attempt extended insert with status and repayment_months
      insertResult = await pool.query(
        "INSERT INTO loans (user_id, matatu_id, amount_applied, loan_type, amount_issued, amount_due, status, repayment_months) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          userId,
          matatuId || null,
          parsedLoanAmount,
          loanType,
          0,
          0,
          "pending",
          repMonthsValue,
        ],
      );
    } catch (extendedErr) {
      // Fallback: try inserting without `status` but with repayment_months
      try {
        insertResult = await pool.query(
          "INSERT INTO loans (user_id, matatu_id, amount_applied, loan_type, amount_issued, amount_due, repayment_months) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            userId,
            matatuId || null,
            parsedLoanAmount,
            loanType,
            0,
            0,
            repMonthsValue,
          ],
        );
      } catch (fallbackErr) {
        // Final fallback: minimal insert (older schemas) without repayment_months
        insertResult = await pool.query(
          "INSERT INTO loans (user_id, matatu_id, amount_applied, loan_type) VALUES (?, ?, ?, ?)",
          [userId, matatuId || null, parsedLoanAmount, loanType],
        );
      }
    }

    const loanId =
      (insertResult && insertResult.insertId) ||
      (Array.isArray(insertResult) &&
        insertResult[0] &&
        insertResult[0].insertId) ||
      null;

    if (!loanId) {
      console.error("Loan insert did not return an insertId", insertResult);
      return res.status(500).json({ error: "Failed to create loan" });
    }

    console.log(
      "Loan created with loanId:",
      loanId,
      "loanType:",
      loanType,
      "matatu_id:",
      matatuId || null,
    );

    if (parsedGuarantors.length > 0) {
      const values = parsedGuarantors.map((gId) => [loanId, gId]);
      try {
        await pool.query(
          "INSERT INTO guarantors (loan_id, guarantor_id) VALUES ?",
          [values],
        );
      } catch (gErr) {
        console.error("Failed to attach guarantors:", gErr);
        // We don't fail the whole request; return partial success info
        return res.status(201).json({
          message:
            "Loan application submitted; failed to attach some guarantors",
        });
      }

      return res
        .status(201)
        .json({ message: "Loan application submitted with guarantors" });
    }

    return res
      .status(201)
      .json({ message: "Loan application submitted successfully" });
  } catch (err) {
    console.error("Error creating loan request:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const approveLoan = async (req, res) => {
  const { loanId } = req.body;
  if (!loanId)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    // Fetch loan and any repayment_months previously supplied at application time
    // Also retrieve `status` and `amount_issued` when available to enforce state transitions
    const loanRows = await pool.query(
      "SELECT user_id, amount_applied, matatu_id, loan_type, repayment_months, status, amount_issued FROM loans WHERE loan_id = ?",
      [loanId],
    );
    if (!loanRows || loanRows.length === 0)
      return res.status(404).json({ error: "Loan not found" });

    const loan = loanRows[0];
    const userId = loan.user_id;
    const amountApplied = loan.amount_applied;
    const loanType = loan.loan_type;
    // prefer DB repayment_months, otherwise fall back to 1
    const repaymentMonths = parseRepaymentMonths(loan.repayment_months) || 1;

    // For normal loans, matatu_id must be present
    if (loanType === "normal" && !loan.matatu_id)
      return res.status(400).json({ error: "Normal loan missing matatu_id" });

    // Use the applied amount as the issued amount
    const parsedAmountIssued = Number(amountApplied);
    if (!Number.isFinite(parsedAmountIssued) || parsedAmountIssued <= 0)
      return res.status(400).json({ error: "Invalid loan amount" });

    // Fetch savings and ensure can be given this loan
    try {
      let totalSavings, recordCount;
      if (loanType === "normal") {
        // For normal loans, check matatu savings
        totalSavings = await getSavings(loan.matatu_id);
        // Check if savings records exist for this matatu
        const cntRes = await pool.query(
          "SELECT COUNT(*) AS cnt FROM savings WHERE matatu_id = ?",
          [loan.matatu_id],
        );
        const cntRows =
          Array.isArray(cntRes) && Array.isArray(cntRes[0])
            ? cntRes[0]
            : cntRes;
        recordCount = cntRows && cntRows[0] ? Number(cntRows[0].cnt || 0) : 0;
      } else {
        // For emergency loans, check user savings
        totalSavings = await getUserSavings(userId);
        // Check if savings records exist for this user
        const cntRes = await pool.query(
          "SELECT COUNT(*) AS cnt FROM savings WHERE user_id = ?",
          [userId],
        );
        const cntRows =
          Array.isArray(cntRes) && Array.isArray(cntRes[0])
            ? cntRes[0]
            : cntRes;
        recordCount = cntRows && cntRows[0] ? Number(cntRows[0].cnt || 0) : 0;
      }

      if (!Number.isFinite(totalSavings) || recordCount === 0) {
        return res.status(400).json({
          error: "Insufficient savings balance for this loan.",
        });
      }

      if (parsedAmountIssued > totalSavings) {
        return res.status(400).json({
          error: "Loan amount cannot be greater than savings balance.",
        });
      }
    } catch (sErr) {
      console.error("Error fetching user savings for approveLoan:", sErr);
      return res.status(500).json({ error: "Internal server error" });
    }

    // validate repaymentMonths by loan type
    if (
      loanType === "emergency" &&
      (repaymentMonths < 1 || repaymentMonths > 3)
    )
      return res
        .status(400)
        .json({ error: "Emergency loans allow 1-3 months repayment" });
    if (loanType === "normal" && (repaymentMonths < 1 || repaymentMonths > 6))
      return res
        .status(400)
        .json({ error: "Normal loans allow 1-6 months repayment" });

    // Compute repayment details
    const totalRepayable = parsedAmountIssued; // extend here if interest is added
    const monthlyInstallment = roundToTwo(totalRepayable / repaymentMonths);
    const disbursementDate = new Date();
    const nextDue = addMonths(disbursementDate, 1);
    const finalDue = addMonths(disbursementDate, repaymentMonths);
    const outstandingBalance = roundToTwo(totalRepayable);
    const autoDeduct = loanType === "normal" ? 1 : 0;

    // Enforce state transition: only allow approving loans that are pending.
    // If `status` column exists, require it to be 'pending'. Otherwise fall
    // back to checking `amount_issued` (older schemas) to avoid double-issuing.
    if (loan.status !== undefined && loan.status !== null) {
      if (String(loan.status) !== "pending") {
        return res
          .status(400)
          .json({ error: "Only pending loans can be approved" });
      }
    } else {
      // Fallback: if amount_issued is present and non-zero, consider already issued
      if (loan.amount_issued && Number(loan.amount_issued) !== 0) {
        return res
          .status(400)
          .json({ error: "Loan already issued or not pending" });
      }
    }

    // Perform update + savings insert + create installments inside a transaction
    let connection;
    try {
      connection = await new Promise((resolve, reject) =>
        pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn))),
      );
      const connQuery = util.promisify(connection.query).bind(connection);
      const beginTransaction = util
        .promisify(connection.beginTransaction)
        .bind(connection);
      const commit = util.promisify(connection.commit).bind(connection);
      const rollback = util.promisify(connection.rollback).bind(connection);

      await beginTransaction();
      try {
        // Try to update with new repayment fields; fallback if DB lacks columns
        try {
          await connQuery(
            "UPDATE loans SET amount_issued = ?, amount_due = amount_due + ?, status = ?, repayment_months = ?, monthly_installment = ?, disbursement_date = ?, next_due_date = ?, final_due_date = ?, outstanding_balance = ?, repayment_status = ?, auto_deduction_enabled = ? WHERE loan_id = ?",
            [
              parsedAmountIssued,
              parsedAmountIssued,
              "approved",
              repaymentMonths,
              monthlyInstallment,
              toSqlDateTime(disbursementDate),
              toSqlDateTime(nextDue),
              toSqlDateTime(finalDue),
              outstandingBalance,
              "ongoing",
              autoDeduct,
              loanId,
            ],
          );
        } catch (err) {
          // Fallback: update without the new repayment columns
          if (
            err.code === "ER_BAD_FIELD_ERROR" ||
            /repayment_months|monthly_installment|disbursement_date|next_due_date|final_due_date|outstanding_balance|repayment_status|auto_deduction_enabled/.test(
              err.message || "",
            )
          ) {
            await connQuery(
              "UPDATE loans SET amount_issued = ?, amount_due = amount_due + ? WHERE loan_id = ?",
              [parsedAmountIssued, parsedAmountIssued, loanId],
            );
            // Since status column exists (checked earlier), set it separately
            try {
              await connQuery("UPDATE loans SET status = ? WHERE loan_id = ?", [
                "approved",
                loanId,
              ]);
            } catch (statusErr) {
              console.warn("Could not set status to approved:", statusErr);
            }
          } else {
            throw err;
          }
        }

        // Create negative savings entry for disbursed amount (only for normal loans)
        if (loanType === "normal") {
          await connQuery(
            "INSERT INTO savings (user_id, matatu_id, amount, created_at) VALUES (?, ?, ?, NOW())",
            [userId, loan.matatu_id || null, -parsedAmountIssued],
          );
        }

        // Create installment entries if table exists
        try {
          await createInstallments(
            connQuery,
            loanId,
            disbursementDate,
            repaymentMonths,
            monthlyInstallment,
            userId,
          );
        } catch (ciErr) {
          console.warn("Could not create installments:", ciErr);
        }

        await commit();
      } catch (txErr) {
        try {
          await rollback();
        } catch (rbErr) {
          console.error("Rollback failed:", rbErr);
        }
        throw txErr;
      } finally {
        connection.release();
      }

      console.log(
        "Loan approved with loanId:",
        loanId,
        "amountIssued:",
        parsedAmountIssued,
        "status set to approved",
      );

      // Notify user by email (best-effort) only after successful commit
      try {
        const userRows = await pool.query(
          "SELECT email, first_name FROM Users WHERE user_id = ?",
          [userId],
        );
        const user =
          Array.isArray(userRows) && userRows[0] ? userRows[0] : null;
        if (user && user.email) {
          sendLoanApprovedEmail(
            user.email,
            user.first_name || "",
            parsedAmountIssued,
            loanId,
          ).catch((e) =>
            console.error("Failed to send loan approved email:", e),
          );
        }
      } catch (notifyErr) {
        console.error("Error fetching user for notification:", notifyErr);
      }
    } catch (err) {
      // If we acquired a connection but failed before release, ensure it's released
      if (connection)
        try {
          connection.release();
        } catch (_) {}
      throw err;
    }

    return res.status(200).json({
      message: "Loan approved, disbursed and repayment schedule created",
    });
  } catch (err) {
    console.error("Error approving loan:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const disapproveLoan = async (req, res) => {
  const { loanId, reason } = req.body;
  if (!loanId) return res.status(400).json({ error: "Missing loanId" });

  try {
    const loanRows = await pool.query(
      "SELECT user_id, amount_applied, status, amount_issued FROM loans WHERE loan_id = ?",
      [loanId],
    );
    if (!loanRows || loanRows.length === 0)
      return res.status(404).json({ error: "Loan not found" });

    const loan = loanRows[0];
    const userId = loan.user_id;

    // Only allow disapproval of pending loans. Use `status` when available,
    // otherwise fall back to `amount_issued` checks for older schemas.
    if (loan.status !== undefined && loan.status !== null) {
      if (String(loan.status) !== "pending") {
        return res
          .status(400)
          .json({ error: "Only pending loans can be disapproved" });
      }
    } else {
      if (loan.amount_issued && Number(loan.amount_issued) !== 0) {
        return res
          .status(400)
          .json({ error: "Loan already issued or not pending" });
      }
    }

    // Perform the disapproval update inside a transaction, then notify after commit
    let connection;
    try {
      connection = await new Promise((resolve, reject) =>
        pool.getConnection((err, conn) => (err ? reject(err) : resolve(conn))),
      );
      const connQuery = util.promisify(connection.query).bind(connection);
      const beginTransaction = util
        .promisify(connection.beginTransaction)
        .bind(connection);
      const commit = util.promisify(connection.commit).bind(connection);
      const rollback = util.promisify(connection.rollback).bind(connection);

      await beginTransaction();
      try {
        try {
          await connQuery(
            "UPDATE loans SET status = ?, rejection_reason = ? WHERE loan_id = ?",
            ["disapproved", reason || "No reason provided", loanId],
          );
        } catch (err) {
          if (
            err.code === "ER_BAD_FIELD_ERROR" ||
            /status|rejection_reason/.test(err.message || "")
          ) {
            // Fallback: set amount_issued to -1 so it won't be considered pending by amount_issued = 0 checks
            await connQuery(
              "UPDATE loans SET amount_issued = ? WHERE loan_id = ?",
              [-1, loanId],
            );
          } else {
            throw err;
          }
        }

        await commit();
      } catch (txErr) {
        try {
          await rollback();
        } catch (rbErr) {
          console.error("Rollback failed:", rbErr);
        }
        throw txErr;
      } finally {
        connection.release();
      }

      // Notify user (best-effort) only after successful commit
      try {
        const userRows = await pool.query(
          "SELECT email, first_name FROM Users WHERE user_id = ?",
          [userId],
        );
        const user =
          Array.isArray(userRows) && userRows[0] ? userRows[0] : null;
        if (user && user.email) {
          sendLoanDisapprovedEmail(
            user.email,
            user.first_name || "",
            loan.amount_applied,
            loanId,
            reason,
          ).catch((e) =>
            console.error("Failed to send loan disapproved email:", e),
          );
        }
      } catch (notifyErr) {
        console.error(
          "Error fetching user for disapproval notification:",
          notifyErr,
        );
      }
    } catch (err) {
      if (connection)
        try {
          connection.release();
        } catch (_) {}
      throw err;
    }

    return res.status(200).json({ message: "Loan disapproved" });
  } catch (err) {
    console.error("Error disapproving loan:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getPendingLoans = (req, res) => {
  const userId = req.userId;
  // Prefer to check status='pending' if column exists, fall back to amount_issued=0
  pool.query(
    "SELECT loan_id, loan_type, amount_applied, matatu_id FROM loans WHERE (amount_issued = 0 OR status = 'pending') AND user_id = ?",
    [userId],
    (err, results) => {
      if (err) {
        // If 'status' column doesn't exist, fall back to the amount_issued check
        if (
          err.code === "ER_BAD_FIELD_ERROR" ||
          /status/.test(err.message || "")
        ) {
          pool.query(
            "SELECT loan_id, loan_type, amount_applied, matatu_id FROM loans WHERE amount_issued = 0 AND user_id = ?",
            [userId],
            (err2, results2) => {
              if (err2)
                return res.status(500).json({ error: "Internal server error" });
              res.json(results2);
            },
          );
          return;
        }
        return res.status(500).json({ error: "Internal server error" });
      }
      res.json(results);
    },
  );
};

const getAllPendingLoans = (req, res) => {
  // Get all loans for admin to filter by status
  pool.query(
    "SELECT loan_id, loan_type, amount_applied, status, amount_issued, amount_due FROM loans",
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
      res.json(results);
    },
  );
};

const checkLoanEligibility = async (req, res) => {
  const userId = req.userId;
  const { matatu_id } = req.query;
  let hasMatatu =
    matatu_id !== undefined && matatu_id !== null && matatu_id !== "";
  let effectiveMatatuId = matatu_id;
  let isFallback = false;

  if (!hasMatatu) {
    // Fallback to user's first registered matatu
    try {
      const matatuQuery = await pool.query(
        "SELECT matatu_id FROM matatus WHERE owner_id = ? ORDER BY matatu_id ASC LIMIT 1",
        [userId],
      );
      const matatuRows =
        Array.isArray(matatuQuery) && Array.isArray(matatuQuery[0])
          ? matatuQuery[0]
          : matatuQuery;
      if (matatuRows && matatuRows.length > 0) {
        effectiveMatatuId = matatuRows[0].matatu_id;
        hasMatatu = true;
        isFallback = true;
        console.log("Fallback to first matatu_id:", effectiveMatatuId);
      } else {
        console.log("No matatu found for fallback");
      }
    } catch (fallbackErr) {
      console.warn(
        "Error in matatu fallback query:",
        fallbackErr.message || fallbackErr,
      );
      console.log("No matatu found for fallback");
    }
  }

  console.log(
    "Checking loan eligibility for userId:",
    userId,
    "matatu_id:",
    hasMatatu ? effectiveMatatuId : "none",
    isFallback ? "(fallback)" : "",
  );
  try {
    const shareCapital = await pool.query(
      "SELECT status FROM users WHERE user_id = ? AND status = 'approved'",
      [userId],
    );

    // If the user hasn't paid share capital, return a 200 with business-state flags
    // so the client can render an appropriate message instead of treating this
    // as a technical error (400).
    if (!shareCapital.length) {
      const totalSavings = hasMatatu
        ? await getSavings(effectiveMatatuId)
        : await getUserSavings(userId);
      const loanRows = hasMatatu
        ? await pool.query(
            "SELECT COUNT(*) AS active_loans FROM loans WHERE matatu_id = ? AND amount_due > 0",
            [effectiveMatatuId],
          )
        : await pool.query(
            "SELECT COUNT(*) AS active_loans FROM loans WHERE user_id = ? AND amount_due > 0",
            [userId],
          );
      const hasOutstanding =
        Array.isArray(loanRows) && loanRows[0]
          ? loanRows[0].active_loans > 0
          : false;
      return res.json({
        savings: totalSavings,
        shareCapitalPaid: false,
        hasOutstandingLoan: hasOutstanding,
        eligibleForLoan: false,
        totalApprovedEmergencyLoan: 0, // No loans if share capital not paid
      });
    }

    const totalSavings = hasMatatu
      ? await getSavings(effectiveMatatuId)
      : await getUserSavings(userId);
    const loanRows = hasMatatu
      ? await pool.query(
          "SELECT COUNT(*) AS active_loans FROM loans WHERE matatu_id = ? AND amount_due > 0",
          [effectiveMatatuId],
        )
      : await pool.query(
          "SELECT COUNT(*) AS active_loans FROM loans WHERE user_id = ? AND amount_due > 0",
          [userId],
        );

    // Get total approved emergency loan amount for the user
    let totalApprovedEmergencyLoan = 0;
    try {
      const emergencyQuery = await pool.query(
        "SELECT COALESCE(SUM(COALESCE(amount_issued, amount_applied)), 0) AS total FROM loans WHERE user_id = ? AND LOWER(loan_type) = 'emergency' AND LOWER(status) = 'approved'",
        [userId],
      );
      const row =
        Array.isArray(emergencyQuery) && emergencyQuery.length > 0
          ? emergencyQuery[0]
          : {};
      totalApprovedEmergencyLoan = Number(row.total ?? 0);
    } catch (err) {
      console.warn("Error fetching emergency loan total:", err.message || err);
      totalApprovedEmergencyLoan = 0;
    }

    res.json({
      savings: totalSavings,
      shareCapitalPaid: true,
      hasOutstandingLoan: loanRows[0].active_loans > 0,
      eligibleForLoan: totalSavings > 0 && loanRows[0].active_loans === 0,
      totalApprovedEmergencyLoan,
    });
  } catch (err) {
    console.error("Error checking eligibility:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUserSummary = async (req, res) => {
  const userId = req.userId;
  try {
    // Get total savings
    let totalSavings = 0;
    try {
      totalSavings = (await getUserSavings(userId)) || 0;
    } catch (savingsErr) {
      console.warn(
        "Error fetching user savings:",
        savingsErr.message || savingsErr,
      );
      totalSavings = 0;
    }

    // Get total approved emergency loan amount
    let totalApprovedEmergencyLoan = 0;
    try {
      const emergencyLoanQuery = await pool.query(
        "SELECT COALESCE(SUM(COALESCE(amount_issued, amount_applied)), 0) AS totalApprovedEmergencyLoan FROM loans WHERE user_id = ? AND loan_type = 'emergency' AND status = 'approved'",
        [userId],
      );
      console.log(
        "Emergency loan query result:",
        JSON.stringify(emergencyLoanQuery, null, 2),
      );
      // Safe extraction: emergencyLoanQuery is an array of rows
      const row =
        Array.isArray(emergencyLoanQuery) && emergencyLoanQuery.length > 0
          ? emergencyLoanQuery[0]
          : {};
      totalApprovedEmergencyLoan = Number(row.totalApprovedEmergencyLoan ?? 0);
    } catch (loanErr) {
      console.warn(
        "Error fetching emergency loans:",
        loanErr.message || loanErr,
      );
      totalApprovedEmergencyLoan = 0;
    }

    // Eligible emergency loan amount (fixed at 30000 as per frontend)
    const eligibleEmergencyLoanAmount = 30000;

    res.json({
      success: true,
      summary: {
        totalApprovedEmergencyLoan,
        totalSavings,
        eligibleEmergencyLoanAmount,
      },
    });
  } catch (err) {
    console.error("Error getting user summary:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getTotalLoans = (req, res) => {
  const userId = req.userId;
  // Compute total outstanding for approved loans only.
  // Prefer `outstanding_balance` when present; otherwise fall back to amount_due
  // or compute from amount_issued - SUM(loan_payments.amount_paid).
  const sql = `
    SELECT COALESCE(SUM(t.remaining), 0) AS totalLoans FROM (
      SELECT GREATEST(
        COALESCE(l.outstanding_balance, l.amount_due, (COALESCE(l.amount_issued,0) - COALESCE(lp.paid_sum,0))),
        0
      ) AS remaining
      FROM loans l
      LEFT JOIN (
        SELECT loan_id, COALESCE(SUM(amount_paid),0) AS paid_sum
        FROM loan_payments
        GROUP BY loan_id
      ) lp ON lp.loan_id = l.loan_id
      WHERE l.user_id = ? AND l.status = 'approved' AND l.loan_type != 'normal'
    ) t
  `;

  pool.query(sql, [userId], (err, results) => {
    if (err) {
      // Fallback for older schemas that may not have `status` or related columns/tables
      if (
        err.code === "ER_BAD_FIELD_ERROR" ||
        /status|loan_payments|outstanding_balance/.test(err.message || "")
      ) {
        pool.query(
          "SELECT COALESCE(SUM(amount_due), 0) AS totalLoans FROM loans WHERE user_id = ? AND loan_type != 'normal'",
          [userId],
          (err2, results2) => {
            if (err2)
              return res.status(500).json({ error: "Internal server error" });
            return res.json({
              totalLoans:
                results2 && results2[0] ? results2[0].totalLoans || 0 : 0,
            });
          },
        );
        return;
      }
      return res.status(500).json({ error: "Internal server error" });
    }

    const total =
      Array.isArray(results) && results[0] ? results[0].totalLoans || 0 : 0;
    res.json({ totalLoans: total });
  });
};

const latestPayments = (req, res) => {
  const userId = req.userId;
  pool.query(
    `SELECT payment_id, user_id, matatu_id, amount_paid, transaction_code, created_at, loan, savings, insurance, operations
     FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      res.json({ payments: results });
    },
  );
};

const getUserPayments = (req, res) => {
  const userId = req.userId;
  pool.query(
    `SELECT payment_id, user_id, matatu_id, amount_paid, transaction_code, created_at, loan, savings, insurance, operations
     FROM payments WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      res.json({ payments: results });
    },
  );
};

const getActiveLoans = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(400).json({ error: "Unauthorized" });

  try {
    // Prefer queries that use explicit `status` column; fallback when missing
    try {
      const rows = await pool.query(
        "SELECT loan_id, loan_type, amount_applied, amount_issued, amount_due, status, matatu_id FROM loans WHERE user_id = ? AND (amount_issued = 0 OR amount_due > 0 OR status = 'pending' OR status = 'approved')",
        [userId],
      );
      return res.json(rows || []);
    } catch (err) {
      if (
        err.code === "ER_BAD_FIELD_ERROR" ||
        /status/.test(err.message || "")
      ) {
        const rows = await pool.query(
          "SELECT loan_id, loan_type, amount_applied, amount_issued, amount_due, matatu_id FROM loans WHERE user_id = ? AND (amount_issued = 0 OR amount_due > 0)",
          [userId],
        );
        return res.json(rows || []);
      }
      throw err;
    }
  } catch (err) {
    console.error("Error fetching active loans:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------- Payment & MPESA ----------------
const shareholderPayment = async (req, res) => {
  const { amount, phone, user, email } = req.body;
  const userId = req.userId;

  try {
    // Validate and normalize phone
    const normalizedPhone = normalizeKenyanPhoneNumber(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const mpesaResponse = await initiateMpesaSTKPush(
      normalizedPhone,
      amount,
      user,
      {
        userId,
      },
    );
    if (mpesaResponse.ResponseCode !== "0")
      return res.status(500).json({ error: "Failed to initiate payment" });

    const checkoutRequestId = mpesaResponse.CheckoutRequestID || null;
    const mpesaReceiptNumber = "MPESA123456";

    // Update provisional payment saved by initiateMpesaSTKPush, or insert a success record
    try {
      if (checkoutRequestId) {
        await pool.query(
          "UPDATE payments SET amount_paid = ?, status = ? WHERE CheckoutRequestID = ?",
          [amount, "success", checkoutRequestId],
        );
      } else {
        const paymentId = generatePaymentId();
        await pool.query(
          "INSERT INTO payments (payment_id, user_id, amount_paid, transaction_code, CheckoutRequestID, operations, insurance, loan, savings, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [paymentId, userId, amount, "", null, 0, 0, 0, 0, "success"],
        );
      }
    } catch (e) {
      console.error(
        "Error updating/creating provisional payment for shareholder:",
        e,
      );
    }

    await pool.query("UPDATE users SET status = 'approved' WHERE user_id = ?", [
      userId,
    ]);
    shareholderCapitalPaymentEmail(email, user);

    res.json({
      message: "Payment processed successfully",
      mpesaReceiptNumber,
      CheckoutRequestID: checkoutRequestId,
    });
  } catch (err) {
    console.error("Error processing shareholder payment:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Payment Processing (Operations, Insurance, Loan, Savings)
const paymentProcessing = async (req, res) => {
  try {
    const { amount, phone, vehicleRegistrationNumber, matatu_id } = req.body;

    // Validate and normalize phone number to provide clear 400 for invalid numbers
    const normalizedPhone = normalizeKenyanPhoneNumber(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const mpesaResponse = await initiateMpesaSTKPush(
      normalizedPhone,
      amount,
      vehicleRegistrationNumber,
      { userId: req.userId, matatu_id },
    );

    if (mpesaResponse.ResponseCode !== "0")
      return res.status(500).json({ error: "Failed to initiate payment" });

    const checkoutRequestId = mpesaResponse.CheckoutRequestID || null;
    const mpesaReceiptNumber = "MPESA123456";
    let operations = amount < 250 ? amount : 250;
    let remaining = amount - operations;
    let insurance = remaining < 250 ? remaining : 250;
    remaining -= insurance;

    const outstandingLoan = await checkOutstandingLoan(matatu_id);
    let loanPayment = 0;
    let savingsAmount = remaining;

    if (outstandingLoan.amount_due > 0) {
      loanPayment =
        remaining > outstandingLoan.amount_due
          ? outstandingLoan.amount_due
          : remaining;
      savingsAmount = remaining - loanPayment;

      await pool.query(
        "UPDATE loans SET amount_due = amount_due - ? WHERE loan_id = ?",
        [loanPayment, outstandingLoan.loan_id],
      );
      await pool.query(
        "INSERT INTO loan_payments (loan_id, amount_paid, mpesa_receipt_number) VALUES (?, ?, ?)",
        [outstandingLoan.loan_id, loanPayment, mpesaReceiptNumber],
      );
    }

    if (savingsAmount > 0) {
      const paymentId = generatePaymentId();
      await pool.query(
        "INSERT INTO savings (user_id, payment_id, matatu_id, amount) VALUES (?, ?, ?, ?)",
        [req.userId, paymentId, matatu_id, savingsAmount],
      );
    }

    // Update provisional payment record (if present) with calculated allocations
    try {
      if (checkoutRequestId) {
        await pool.query(
          "UPDATE payments SET loan = ?, savings = ?, amount_paid = ?, operations = ?, insurance = ? WHERE CheckoutRequestID = ?",
          [
            loanPayment,
            savingsAmount,
            amount,
            operations,
            insurance,
            checkoutRequestId,
          ],
        );
      } else {
        // Fallback: if no checkout id present, create a pending payment record
        const paymentId = generatePaymentId();
        await pool.query(
          "INSERT INTO payments (payment_id, user_id, loan, savings, matatu_id, amount_paid, transaction_code, operations, insurance, CheckoutRequestID, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            paymentId,
            req.userId,
            loanPayment,
            savingsAmount,
            matatu_id,
            amount,
            "",
            operations,
            insurance,
            null,
            "success",
          ],
        );
      }
    } catch (err) {
      console.error("Error updating/creating provisional payment:", err);
    }

    await pool.query(
      "INSERT INTO mpesastk (mpesastk_id, mpesastk_status, ResultCode, ResultDesc, MpesaReceiptNumber, mpesastk_appid) VALUES (NULL, 'successful', '0', 'Payment successful', ?, ?)",
      [mpesaReceiptNumber, matatu_id],
    );

    res.json({
      message: "Payment processed successfully",
      mpesaReceiptNumber,
      CheckoutRequestID: checkoutRequestId,
    });
  } catch (err) {
    console.error("Error processing payment:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// MPESA Callback
const mpesaCallback = async (req, res) => {
  const { stkCallback } = req.body.Body;
  const { CheckoutRequestID, ResultCode, CallbackMetadata } = stkCallback;

  try {
    // Handle canceled
    if (ResultCode === 1032) {
      await pool.query(
        `UPDATE mpesastk SET mpesastk_status = 'canceled', ResultCode = ?, ResultDesc = ? WHERE mpesastk_id = (SELECT mpesastk_id FROM (SELECT mpesastk_id FROM mpesastk ORDER BY mpesastk_id DESC LIMIT 1) AS sub)`,
        [ResultCode, "Payment canceled by user"],
      );
      // Only mark provisional payment as failed if it isn't already marked success
      try {
        const existing = await pool.query(
          "SELECT status FROM payments WHERE CheckoutRequestID = ?",
          [CheckoutRequestID],
        );
        const rows =
          Array.isArray(existing) && Array.isArray(existing[0])
            ? existing[0]
            : existing;
        const currentStatus = rows && rows[0] ? rows[0].status : null;
        if (currentStatus !== "success") {
          await pool.query(
            "UPDATE payments SET status = ? WHERE CheckoutRequestID = ?",
            ["failed", CheckoutRequestID],
          );
          paymentStatusCache.set(CheckoutRequestID, "failed");
        } else {
          console.info(
            `mpesaCallback: CheckoutRequestID=${CheckoutRequestID} already marked success; skipping failed update.`,
          );
        }
      } catch (e) {
        // ignore
      }
      return res.status(400).json({ error: "Payment canceled by user" });
    }

    // Non-zero is treated as failed
    if (ResultCode !== 0) {
      await pool.query(
        `UPDATE mpesastk SET mpesastk_status = 'failed', ResultCode = ?, ResultDesc = ? WHERE mpesastk_id = (SELECT mpesastk_id FROM (SELECT mpesastk_id FROM mpesastk ORDER BY mpesastk_id DESC LIMIT 1) AS sub)`,
        [ResultCode, "Payment failed"],
      );
      try {
        const existing = await pool.query(
          "SELECT status FROM payments WHERE CheckoutRequestID = ?",
          [CheckoutRequestID],
        );
        const rows =
          Array.isArray(existing) && Array.isArray(existing[0])
            ? existing[0]
            : existing;
        const currentStatus = rows && rows[0] ? rows[0].status : null;
        if (currentStatus !== "success") {
          await pool.query(
            "UPDATE payments SET status = ? WHERE CheckoutRequestID = ?",
            ["failed", CheckoutRequestID],
          );
          paymentStatusCache.set(CheckoutRequestID, "failed");
        } else {
          console.info(
            `mpesaCallback: CheckoutRequestID=${CheckoutRequestID} already marked success; skipping failed update.`,
          );
        }
      } catch (e) {}
      return res.status(500).json({ error: "Payment failed" });
    }

    const mpesaReceiptNumber = CallbackMetadata.Item.find(
      (i) => i.Name === "MpesaReceiptNumber",
    )?.Value;
    const amount = CallbackMetadata.Item.find(
      (i) => i.Name === "Amount",
    )?.Value;
    const matatu_id = req.query.matatu_id;

    // Payment breakdown
    let operations = amount < 250 ? amount : 250;
    let remaining = amount - operations;
    let insurance = remaining < 250 ? remaining : 250;
    remaining -= insurance;

    const outstandingLoan = await checkOutstandingLoan(matatu_id);
    let loanPayment = 0;
    let savings = remaining;

    if (outstandingLoan.amount_due > 0) {
      loanPayment =
        remaining > outstandingLoan.amount_due
          ? outstandingLoan.amount_due
          : remaining;
      savings = remaining - loanPayment;
      await pool.query(
        "UPDATE loans SET amount_due = amount_due - ? WHERE loan_id = ?",
        [loanPayment, outstandingLoan.loan_id],
      );
    }

    if (savings > 0) {
      await pool.query(
        "UPDATE savings SET amount = amount + ? WHERE matatu_id = ?",
        [savings, matatu_id],
      );
    }

    // Try to update provisional payment by CheckoutRequestID; fallback to insert if not found
    try {
      const existing = await pool.query(
        "SELECT * FROM payments WHERE CheckoutRequestID = ?",
        [CheckoutRequestID],
      );
      const rows =
        Array.isArray(existing) && Array.isArray(existing[0])
          ? existing[0]
          : existing;
      if (rows && rows.length > 0) {
        await pool.query(
          "UPDATE payments SET transaction_code = ?, amount_paid = ?, loan = ?, savings = ?, operations = ?, insurance = ?, status = ? WHERE CheckoutRequestID = ?",
          [
            mpesaReceiptNumber,
            amount,
            loanPayment,
            savings,
            operations,
            insurance,
            "success",
            CheckoutRequestID,
          ],
        );
      } else {
        const paymentId = generatePaymentId();
        await pool.query(
          "INSERT INTO payments (payment_id, user_id, loan, savings, matatu_id, amount_paid, transaction_code, operations, insurance, CheckoutRequestID, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            paymentId,
            req.userId,
            loanPayment,
            savings,
            matatu_id,
            amount,
            mpesaReceiptNumber,
            operations,
            insurance,
            CheckoutRequestID,
            "success",
          ],
        );
      }
      paymentStatusCache.set(CheckoutRequestID, "success");
    } catch (e) {
      console.error("Error updating payment record on MPESA callback:", e);
    }

    await pool.query(
      "UPDATE mpesastk SET mpesastk_status = 'successful', ResultCode = ?, ResultDesc = ?, MpesaReceiptNumber = ? WHERE mpesastk_id = (SELECT mpesastk_id FROM (SELECT mpesastk_id FROM mpesastk ORDER BY mpesastk_id DESC LIMIT 1) AS sub)",
      [ResultCode, "Payment successful", mpesaReceiptNumber],
    );

    res.json({ message: "Payment processed successfully", mpesaReceiptNumber });
  } catch (err) {
    console.error("Error processing MPESA callback:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const checkPaymentStatus = async (req, res) => {
  const { CheckoutRequestID } = req.query;

  if (!CheckoutRequestID) {
    return res
      .status(400)
      .json({ error: "Missing CheckoutRequestID in query" });
  }

  try {
    const raw = await pool.query(
      "SELECT * FROM payments WHERE CheckoutRequestID = ?",
      [CheckoutRequestID],
    );

    // Normalize mysql2/promise result which is usually [rows, fields]
    let rows = [];
    if (Array.isArray(raw)) {
      if (Array.isArray(raw[0])) {
        rows = raw[0];
      } else {
        rows = raw;
      }
    }

    if (!rows || rows.length === 0) {
      console.info(
        `checkPaymentStatus: no payment found for CheckoutRequestID=${CheckoutRequestID}`,
      );
      return res.status(404).json({ error: "Payment not found" });
    }

    const payment = rows[0];

    // Prefer explicit DB `status` column (pending/success/failed). Fallback to transaction_code heuristic.
    const dbStatus =
      payment && payment.status
        ? payment.status
        : payment && payment.transaction_code
          ? "success"
          : "pending";

    // Only log when status changes to avoid noisy terminal logs from frequent polling
    const lastStatus = paymentStatusCache.get(CheckoutRequestID);
    if (lastStatus !== dbStatus) {
      console.info(
        `Payment status changed for CheckoutRequestID=${CheckoutRequestID}: ${lastStatus || "unknown"} -> ${dbStatus}`,
      );
      paymentStatusCache.set(CheckoutRequestID, dbStatus);
    }

    // Map DB status to legacy API status for compatibility
    const apiStatus =
      dbStatus === "success"
        ? "completed"
        : dbStatus === "failed"
          ? "failed"
          : "pending";

    // If still pending, avoid verbose logging and return lightweight response
    if (dbStatus === "pending") {
      return res.json({
        status: apiStatus,
        dbStatus,
        mpesaReceiptNumber: payment.transaction_code || null,
      });
    }

    // For non-pending statuses return full payment object
    return res.json({
      status: apiStatus,
      dbStatus,
      mpesaReceiptNumber: payment.transaction_code || null,
      payment,
    });
  } catch (err) {
    console.error("Error checking payment status:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Process due installments: safely deduct monthly installment from user savings
 * for loans with `auto_deduction_enabled = 1`. This function is idempotent:
 * it attempts to atomically claim a pending installment by setting status='processing'
 * and proceeds only when it succeeds.
 */
const processDueInstallments = async () => {
  console.info("processDueInstallments: starting scan for due installments");
  try {
    // Find pending installments that are due and belong to loans where auto deduction is enabled
    const rows = await pool.query(
      `SELECT li.id AS installment_id, li.loan_id, li.amount AS installment_amount, li.due_date, l.user_id
       FROM loan_installments li
       JOIN loans l ON l.loan_id = li.loan_id
       WHERE li.status = 'pending' AND li.due_date <= NOW() AND COALESCE(l.auto_deduction_enabled, 0) = 1`,
    );

    const installments =
      Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : rows;
    if (!installments || installments.length === 0) {
      console.info("processDueInstallments: no due installments found");
      return;
    }

    for (const inst of installments) {
      const installmentId = inst.installment_id || inst.id;
      const loanId = inst.loan_id;
      const amount = Number(inst.installment_amount || inst.amount || 0);

      // Try to atomically claim this installment (avoid double processing)
      const claimRes = await pool.query(
        "UPDATE loan_installments SET status = 'processing' WHERE id = ? AND status = 'pending'",
        [installmentId],
      );
      const claimOk = Array.isArray(claimRes)
        ? (claimRes[0] && claimRes[0].affectedRows > 0) ||
          claimRes.affectedRows > 0
        : claimRes.affectedRows > 0;
      if (!claimOk) {
        // someone else is processing it
        continue;
      }

      // Using a dedicated connection per installment for transactional safety
      let connection;
      try {
        connection = await new Promise((resolve, reject) =>
          pool.getConnection((err, conn) =>
            err ? reject(err) : resolve(conn),
          ),
        );
        const connQuery = util.promisify(connection.query).bind(connection);
        const beginTransaction = util
          .promisify(connection.beginTransaction)
          .bind(connection);
        const commit = util.promisify(connection.commit).bind(connection);
        const rollback = util.promisify(connection.rollback).bind(connection);

        await beginTransaction();
        try {
          // Re-check installment status inside transaction
          const check = await connQuery(
            "SELECT status, loan_id, amount FROM loan_installments WHERE id = ? FOR UPDATE",
            [installmentId],
          );
          const checkRows =
            Array.isArray(check) && Array.isArray(check[0]) ? check[0] : check;
          if (!checkRows || checkRows.length === 0) {
            await rollback();
            connection.release();
            continue;
          }
          const row = checkRows[0];
          if (row.status !== "processing") {
            // another worker changed it
            await rollback();
            connection.release();
            continue;
          }

          // Get user_id for loan and loan_type
          const loanRows = await connQuery(
            "SELECT user_id, amount_due, outstanding_balance, loan_type FROM loans WHERE loan_id = ? FOR UPDATE",
            [loanId],
          );
          const loanRowsNorm =
            Array.isArray(loanRows) && Array.isArray(loanRows[0])
              ? loanRows[0]
              : loanRows;
          if (!loanRowsNorm || loanRowsNorm.length === 0) {
            await connQuery(
              "UPDATE loan_installments SET status = 'failed' WHERE id = ?",
              [installmentId],
            );
            await commit();
            connection.release();
            continue;
          }
          const loan = loanRowsNorm[0];
          const userId = loan.user_id;
          const loanType = loan.loan_type;

          let deductionSuccessful = false;
          if (loanType === "emergency") {
            // For emergency loans, deduct from both applicant and guarantor (50/50 split)
            const guarantorRows = await connQuery(
              "SELECT guarantor_id FROM guarantors WHERE loan_id = ? LIMIT 1",
              [loanId],
            );
            const guarantorRowsNorm =
              Array.isArray(guarantorRows) && Array.isArray(guarantorRows[0])
                ? guarantorRows[0]
                : guarantorRows;
            if (guarantorRowsNorm && guarantorRowsNorm.length > 0) {
              const guarantorId = guarantorRowsNorm[0].guarantor_id;
              const halfAmount = roundToTwo(amount / 2);
              const userSavings = await getUserSavings(userId);
              const guarantorSavings = await getUserSavings(guarantorId);
              if (
                Number(userSavings) >= halfAmount &&
                Number(guarantorSavings) >= halfAmount
              ) {
                // Deduct half from each
                await connQuery(
                  "INSERT INTO savings (user_id, matatu_id, amount, created_at) VALUES (?, ?, ?, NOW())",
                  [userId, null, -halfAmount],
                );
                await connQuery(
                  "INSERT INTO savings (user_id, matatu_id, amount, created_at) VALUES (?, ?, ?, NOW())",
                  [guarantorId, null, -halfAmount],
                );
                deductionSuccessful = true;
              }
            }
          } else {
            // For normal loans, deduct from user
            const userSavings = await getUserSavings(userId);
            if (Number(userSavings) >= Number(amount)) {
              await connQuery(
                "INSERT INTO savings (user_id, matatu_id, amount, created_at) VALUES (?, ?, ?, NOW())",
                [userId, null, -amount],
              );
              deductionSuccessful = true;
            }
          }

          if (deductionSuccessful) {
            // Mark installment paid
            await connQuery(
              "UPDATE loan_installments SET status = 'paid', paid_amount = ?, paid_at = NOW() WHERE id = ?",
              [amount, installmentId],
            );

            // Update loan outstanding/amount_due
            try {
              await connQuery(
                "UPDATE loans SET outstanding_balance = GREATEST(COALESCE(outstanding_balance, amount_due) - ?, 0), amount_due = GREATEST(COALESCE(amount_due, 0) - ?, 0) WHERE loan_id = ?",
                [amount, amount, loanId],
              );
            } catch (udErr) {
              // Fallback: update only amount_due
              await connQuery(
                "UPDATE loans SET amount_due = GREATEST(COALESCE(amount_due, 0) - ?, 0) WHERE loan_id = ?",
                [amount, loanId],
              );
            }

            // Record the payment
            try {
              await connQuery(
                "INSERT INTO loan_payments (loan_id, amount_paid, payment_date) VALUES (?, ?, NOW())",
                [loanId, amount],
              );
            } catch (payErr) {
              console.warn(
                "Could not record loan payment:",
                payErr.message || payErr,
              );
            }

            // Record the payment
            try {
              await connQuery(
                "INSERT INTO loan_payments (loan_id, amount_paid, payment_date) VALUES (?, ?, NOW())",
                [loanId, amount],
              );
            } catch (payErr) {
              console.warn(
                "Could not record loan payment:",
                payErr.message || payErr,
              );
            }

            // Set next_due_date to the next pending installment if any
            const next = await connQuery(
              "SELECT due_date FROM loan_installments WHERE loan_id = ? AND status = 'pending' ORDER BY due_date ASC LIMIT 1",
              [loanId],
            );
            const nextRows =
              Array.isArray(next) && Array.isArray(next[0]) ? next[0] : next;
            if (nextRows && nextRows.length > 0) {
              await connQuery(
                "UPDATE loans SET next_due_date = ? WHERE loan_id = ?",
                [nextRows[0].due_date, loanId],
              );
            } else {
              // no more pending installments: mark loan completed
              await connQuery(
                "UPDATE loans SET next_due_date = NULL, repayment_status = 'completed', outstanding_balance = 0 WHERE loan_id = ?",
                [loanId],
              );
            }

            await commit();
            connection.release();
          } else {
            // insufficient funds: mark installment failed/pending for retry
            await connQuery(
              "UPDATE loan_installments SET status = 'failed' WHERE id = ?",
              [installmentId],
            );
            console.info(
              `processDueInstallments: insufficient savings for installment ${installmentId} (loan ${loanId}, type ${loanType})`,
            );
            await commit();
            connection.release();
          }
        } catch (txErr) {
          try {
            await rollback();
          } catch (rb) {}
          connection.release();
          console.error("processDueInstallments: tx error", txErr);
        }
      } catch (e) {
        if (connection)
          try {
            connection.release();
          } catch (_) {}
        console.error("processDueInstallments: connection error", e);
      }
    }
  } catch (err) {
    // If the query fails because the table/columns don't exist, warn and return
    if (
      err &&
      (err.code === "ER_NO_SUCH_TABLE" ||
        /loan_installments/.test(err.message || ""))
    ) {
      console.warn(
        "processDueInstallments: loan_installments table or columns missing, skipping auto-deduction. Create the migration to enable this feature.",
      );
      return;
    }
    console.error("processDueInstallments: unexpected error", err);
  }
};

// Run once on startup, then schedule hourly. In production consider using a dedicated worker or cron instead.
const checkLoanInstallmentsSchema = async () => {
  try {
    // Check if loan_installments table exists
    const tableQuery = await pool.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'loan_installments'",
    );
    const tableRows =
      Array.isArray(tableQuery) && Array.isArray(tableQuery[0])
        ? tableQuery[0]
        : tableQuery;
    if (!tableRows || tableRows.length === 0 || tableRows[0].count == 0) {
      console.info(
        "checkLoanInstallmentsSchema: loan_installments table missing, skipping auto-deduction startup check",
      );
      return false;
    }

    // Check required columns exist
    const requiredColumns = [
      "id",
      "loan_id",
      "amount",
      "due_date",
      "status",
      "paid_amount",
      "paid_at",
    ];
    for (const col of requiredColumns) {
      const colQuery = await pool.query(
        "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'loan_installments' AND column_name = ?",
        [col],
      );
      const colRows =
        Array.isArray(colQuery) && Array.isArray(colQuery[0])
          ? colQuery[0]
          : colQuery;
      if (!colRows || colRows.length === 0 || colRows[0].count == 0) {
        console.info(
          `checkLoanInstallmentsSchema: loan_installments.${col} column missing, skipping auto-deduction startup check`,
        );
        return false;
      }
    }

    // Check loans table has auto_deduction_enabled
    const loansQuery = await pool.query(
      "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'loans' AND column_name = 'auto_deduction_enabled'",
    );
    const loansRows =
      Array.isArray(loansQuery) && Array.isArray(loansQuery[0])
        ? loansQuery[0]
        : loansQuery;
    if (!loansRows || loansRows.length === 0 || loansRows[0].count == 0) {
      console.info(
        "checkLoanInstallmentsSchema: loans.auto_deduction_enabled column missing, skipping auto-deduction startup check",
      );
      return false;
    }

    return true;
  } catch (err) {
    console.warn(
      "checkLoanInstallmentsSchema: error checking schema, skipping auto-deduction",
      err.message || err,
    );
    return false;
  }
};

const initAutoDeduction = async () => {
  const schemaOk = await checkLoanInstallmentsSchema();
  if (schemaOk) {
    processDueInstallments().catch((e) =>
      console.info("processDueInstallments initial run error:", e),
    );
  } else {
    console.info(
      "Auto-deduction schema not ready, skipping initial run. Run the migration to enable this feature.",
    );
  }
};

// Run once on startup, then schedule hourly. In production consider using a dedicated worker or cron instead.
// initAutoDeduction is called from server.js after DB and schema are ready
setInterval(
  () =>
    processDueInstallments().catch((e) =>
      console.error("processDueInstallments error:", e),
    ),
  1000 * 60 * 60,
);

module.exports = {
  getSavings,
  getLoans,
  getInsurance,
  getPayments,
  loanRequest,
  approveLoan,
  disapproveLoan,
  getPendingLoans,
  getAllPendingLoans,
  paymentProcessing,
  checkLoanEligibility,
  getUserSummary,
  getTotalLoans,
  getTotalSavings,
  latestPayments,
  getUserPayments,
  mpesaCallback,
  checkPaymentStatus,
  shareholderPayment,
  getActiveLoans,
  processDueInstallments,
  initAutoDeduction,
};
