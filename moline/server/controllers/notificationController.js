const { pool } = require("../config/database");
const {
  sendLoanApprovedEmail,
  sendLoanDisapprovedEmail,
} = require("../utils/mailer");

const sendEmergencyApprovalEmail = async (req, res) => {
  const { loanId, amountIssued } = req.body;
  if (!loanId) return res.status(400).json({ error: "Missing loanId" });

  try {
    const loanRows = await pool.query(
      "SELECT user_id, amount_applied FROM loans WHERE loan_id = ?",
      [loanId],
    );
    if (!loanRows || loanRows.length === 0)
      return res.status(404).json({ error: "Loan not found" });

    const loan = loanRows[0];
    const userRows = await pool.query(
      "SELECT email, first_name FROM Users WHERE user_id = ?",
      [loan.user_id],
    );
    const user = Array.isArray(userRows) && userRows[0] ? userRows[0] : null;
    if (!user || !user.email)
      return res.status(404).json({ error: "User email not found" });

    // Best-effort email send
    sendLoanApprovedEmail(
      user.email,
      user.first_name || "",
      amountIssued || loan.amount_applied,
      loanId,
    )
      .then(() => {})
      .catch((e) => console.error("Error sending loan approved email:", e));

    return res.status(200).json({ message: "Approval email queued" });
  } catch (err) {
    console.error("Error in sendEmergencyApprovalEmail:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const sendNormalApprovalEmail = sendEmergencyApprovalEmail;

const sendEmergencyDisapprovalEmail = async (req, res) => {
  const { loanId, reason } = req.body;
  if (!loanId) return res.status(400).json({ error: "Missing loanId" });

  try {
    const loanRows = await pool.query(
      "SELECT user_id, amount_applied FROM loans WHERE loan_id = ?",
      [loanId],
    );
    if (!loanRows || loanRows.length === 0)
      return res.status(404).json({ error: "Loan not found" });

    const loan = loanRows[0];
    const userRows = await pool.query(
      "SELECT email, first_name FROM Users WHERE user_id = ?",
      [loan.user_id],
    );
    const user = Array.isArray(userRows) && userRows[0] ? userRows[0] : null;
    if (!user || !user.email)
      return res.status(404).json({ error: "User email not found" });

    sendLoanDisapprovedEmail(
      user.email,
      user.first_name || "",
      loan.amount_applied,
      loanId,
      reason,
    )
      .then(() => {})
      .catch((e) => console.error("Error sending loan disapproved email:", e));

    return res.status(200).json({ message: "Disapproval email queued" });
  } catch (err) {
    console.error("Error in sendEmergencyDisapprovalEmail:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const sendNormalDisapprovalEmail = sendEmergencyDisapprovalEmail;

module.exports = {
  sendEmergencyApprovalEmail,
  sendNormalApprovalEmail,
  sendEmergencyDisapprovalEmail,
  sendNormalDisapprovalEmail,
};
