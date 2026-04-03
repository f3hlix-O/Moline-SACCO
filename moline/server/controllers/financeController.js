require("dotenv").config();
const { pool } = require("../config/database");
const axios = require("axios");
const { shareholderCapitalPaymentEmail } = require("../utils/mailer");

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

const convertPhoneNumber = (phone) =>
  phone.startsWith("0") ? `254${phone.substring(1)}` : phone;

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
  const internationalPhone = convertPhoneNumber(phone);

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
    const [result] = await pool.query(query, [matatu_id]);
    return result.length > 0 ? result[0].total_savings : 0;
  } catch (error) {
    console.error("Error fetching savings:", error);
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

// ---------------- Controllers ----------------
const getTotalSavings = (req, res) => {
  const userId = req.userId;
  pool.query(
    "SELECT SUM(amount) AS totalSavings FROM savings WHERE user_id = ?",
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

const loanRequest = (req, res) => {
  const userId = req.userId;
  const { matatuId, loanAmount, loanType, guarantors } = req.body;

  if (!loanAmount || !loanType)
    return res.status(400).json({ error: "Missing required fields" });

  let parsedGuarantors = [];
  if (loanType === "emergency" && guarantors) {
    try {
      parsedGuarantors = JSON.parse(guarantors);
    } catch {
      return res.status(400).json({ error: "Invalid guarantors format" });
    }
  }

  pool.query(
    "INSERT INTO loans (user_id, matatu_id, amount_applied, loan_type) VALUES (?, ?, ?, ?)",
    [userId, matatuId, loanAmount, loanType],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Internal server error" });

      const loanId = result.insertId;
      if (parsedGuarantors.length > 0) {
        const values = parsedGuarantors.map((gId) => [loanId, gId]);
        pool.query(
          "INSERT INTO guarantors (loan_id, guarantor_id) VALUES ?",
          [values],
          (err) => {
            if (err)
              return res.status(500).json({ error: "Internal server error" });
            res
              .status(201)
              .json({ message: "Loan application submitted with guarantors" });
          },
        );
      } else {
        res
          .status(201)
          .json({ message: "Loan application submitted successfully" });
      }
    },
  );
};

const approveLoan = (req, res) => {
  const { loanId, amountIssued, matatuId } = req.body;
  if (!loanId || !amountIssued || !matatuId)
    return res.status(400).json({ error: "Missing required fields" });

  pool.query(
    "SELECT user_id, amount_applied FROM loans WHERE loan_id = ?",
    [loanId],
    (err, loanRows) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      if (!loanRows.length)
        return res.status(404).json({ error: "Loan not found" });

      const { user_id, amount_applied } = loanRows[0];
      if (amountIssued > amount_applied)
        return res.status(400).json({ error: "Amount exceeds applied" });

      pool.query(
        "UPDATE loans SET amount_issued = ?, amount_due = amount_due + ? WHERE loan_id = ?",
        [amountIssued, amountIssued, loanId],
        (err) => {
          if (err)
            return res.status(500).json({ error: "Internal server error" });

          pool.query(
            "INSERT INTO savings (user_id, matatu_id, amount, created_at) VALUES (?, ?, ?, NOW())",
            [user_id, matatuId, -amountIssued],
            (err) => {
              if (err)
                return res.status(500).json({ error: "Internal server error" });
              res
                .status(200)
                .json({ message: "Loan approved and savings updated" });
            },
          );
        },
      );
    },
  );
};

const getPendingLoans = (req, res) => {
  const userId = req.userId;
  pool.query(
    "SELECT loan_id, loan_type, amount_applied, matatu_id FROM loans WHERE amount_issued = 0 AND user_id = ?",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      res.json(results);
    },
  );
};

const getAllPendingLoans = (req, res) => {
  pool.query(
    "SELECT loan_id, loan_type, amount_applied FROM loans WHERE amount_issued = 0",
    (err, results) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      res.json(results);
    },
  );
};

const checkLoanEligibility = async (req, res) => {
  const userId = req.userId;
  const { matatu_id } = req.query;
  if (!userId) return res.status(400).json({ error: "Unauthorized" });
  console.log(
    "Checking loan eligibility for userId:",
    userId,
    "matatu_id:",
    matatu_id,
  );
  try {
    const [shareCapital] = await pool.query(
      "SELECT status FROM users WHERE user_id = ? AND status = 'approved'",
      [userId],
    );

    // If the user hasn't paid share capital, return a 200 with business-state flags
    // so the client can render an appropriate message instead of treating this
    // as a technical error (400).
    if (!shareCapital.length) {
      const totalSavings = await getSavings(matatu_id);
      const [loanRows] = await pool.query(
        "SELECT COUNT(*) AS active_loans FROM loans WHERE matatu_id = ? AND amount_due > 0",
        [matatu_id],
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
      });
    }

    const totalSavings = await getSavings(matatu_id);
    const [loanRows] = await pool.query(
      "SELECT COUNT(*) AS active_loans FROM loans WHERE matatu_id = ? AND amount_due > 0",
      [matatu_id],
    );

    res.json({
      savings: totalSavings,
      shareCapitalPaid: true,
      hasOutstandingLoan: loanRows[0].active_loans > 0,
      eligibleForLoan: totalSavings > 0 && loanRows[0].active_loans === 0,
    });
  } catch (err) {
    console.error("Error checking eligibility:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getTotalLoans = (req, res) => {
  const userId = req.userId;
  pool.query(
    "SELECT SUM(amount_due) AS totalLoans FROM loans WHERE user_id = ?",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      res.json(results[0]);
    },
  );
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

// ---------------- Payment & MPESA ----------------
const shareholderPayment = async (req, res) => {
  const { amount, phone, user, email } = req.body;
  const userId = req.userId;

  try {
    const mpesaResponse = await initiateMpesaSTKPush(phone, amount, user, {
      userId,
    });
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
    const mpesaResponse = await initiateMpesaSTKPush(
      phone,
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
        const [existing] = await pool.query(
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
        const [existing] = await pool.query(
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
      const [existing] = await pool.query(
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

module.exports = {
  getSavings,
  getLoans,
  getInsurance,
  getPayments,
  loanRequest,
  approveLoan,
  getPendingLoans,
  getAllPendingLoans,
  paymentProcessing,
  checkLoanEligibility,
  getTotalLoans,
  getTotalSavings,
  latestPayments,
  mpesaCallback,
  checkPaymentStatus,
  shareholderPayment,
};
