const nodemailer = require("nodemailer");
require("dotenv").config();

// Determine credentials and transport options (support EMAIL_USER/EMAIL_PASS and legacy APP_EMAIL/APP_PASSWORD)
const EMAIL_USER = process.env.EMAIL_USER || process.env.APP_EMAIL;
const EMAIL_PASS = process.env.EMAIL_PASS || process.env.APP_PASSWORD;
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || "gmail";
const SMTP_HOST = process.env.EMAIL_SMTP_HOST; // optional custom SMTP host
const SMTP_PORT = process.env.EMAIL_SMTP_PORT
  ? parseInt(process.env.EMAIL_SMTP_PORT, 10)
  : undefined;
const SMTP_SECURE = process.env.EMAIL_SMTP_SECURE === "true";

let transporter;
if (SMTP_HOST) {
  // Use explicit SMTP host/port when provided
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT || 587,
    secure: SMTP_SECURE || false,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
} else {
  // Use well-known service (e.g., gmail)
  transporter = nodemailer.createTransport({
    service: EMAIL_SERVICE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
}

// Optional: verify transporter
// transporter.verify((error) => {
//     if (error) {
//         console.error(" Email server error:", error);
//     } else {
//         console.log(" Email server ready");
//     }
// });

//  Reusable email sender that returns the nodemailer info or throws on error
const sendEmail = async (options) => {
  const fromAddress = `"Moline SACCO" <${EMAIL_USER}>`;
  const mailOptions = {
    from: fromAddress,
    to: options.to,
    subject: options.subject,
    text: options.text || "",
    html: options.html || "",
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(
    `Email sent: ${info && info.response ? info.response : JSON.stringify(info)}`,
  );
  return info;
};

//  1. Approval Email
const sendApprovalEmail = async (email, firstName) => {
  try {
    await sendEmail({
      to: email,
      subject: "Account Approved - Moline SACCO",
      html: `
            <h2>Hello ${firstName},</h2>
            <p>Your account has been <strong>approved</strong> ✅.</p>
            <p>You can now log in and continue using our services.</p>
            <br/>
            <p>Regards,<br/>Moline SACCO Team</p>
        `,
    });
  } catch (err) {
    console.error("Error sending approval email:", err);
  }
};

//  2. Disapproval Email
const sendDisapprovalEmail = async (email, firstName) => {
  try {
    await sendEmail({
      to: email,
      subject: "Account Disapproved - Moline SACCO",
      html: `
            <h2>Hello ${firstName},</h2>
            <p>We regret to inform you that your account request has been <strong>disapproved</strong>.</p>
            <p>For more information, please contact support.</p>
            <br/>
            <p>Regards,<br/>Moline SACCO Team</p>
        `,
    });
  } catch (err) {
    console.error("Error sending disapproval email:", err);
  }
};

//  3. Welcome Email (After Registration)
const sendWelcomeEmail = async (email, firstName) => {
  try {
    return await sendEmail({
      to: email,
      subject: "Welcome to Moline SACCO - Next Steps",
      html: `
            <div style="font-family: Arial;">
                <h2>Hello ${firstName},</h2>
                <p>Welcome to <strong>Moline SACCO</strong> 🎉</p>

                <p>To get started:</p>
                <ul>
                    <li>Log in to your account</li>
                    <li>Pay Shareholder Capital (KES 15,000 via MPESA)</li>
                </ul>

                <p>Once payment is confirmed, full access will be granted.</p>

                <br/>
                <p>Regards,<br/>Moline SACCO Team</p>
            </div>
        `,
    });
  } catch (err) {
    console.error("Error sending welcome email:", err);
    // swallow error to avoid breaking signup flow
    return null;
  }
};

//  4. Shareholder Payment Confirmation
const sendPaymentConfirmationEmail = async (email, firstName) => {
  try {
    await sendEmail({
      to: email,
      subject: "Payment Received - Moline SACCO",
      html: `
            <div style="font-family: Arial;">
                <h2>Hello ${firstName},</h2>
                <p>🎉 Your shareholder capital payment has been received successfully.</p>

                <p>You now have full access to:</p>
                <ul>
                    <li>Loan applications</li>
                    <li>Matatu management</li>
                    <li>Financial tracking & reports</li>
                </ul>

                <p><strong>Next:</strong> Log in and start using the system.</p>

                <br/>
                <p>Welcome aboard!<br/>Moline SACCO Team</p>
            </div>
        `,
    });
  } catch (err) {
    console.error("Error sending payment confirmation email:", err);
  }
};

// Send reset password email with provided reset link
const sendResetPasswordEmail = async (email, resetLink) => {
  return sendEmail({
    to: email,
    subject: "Reset your password - Moline SACCO",
    html: `
      <div style="font-family: Arial, sans-serif; color: #0b1730;">
        <h2>Password reset request</h2>
        <p>We received a request to reset the password for the account associated with <strong>${email}</strong>.</p>
        <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
        <p><a href="${resetLink}" style="display:inline-block;padding:10px 16px;background: #1e3a8a;color:#fff;border-radius:6px;text-decoration:none;">Reset password</a></p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <br/>
        <p>Regards,<br/>Moline SACCO Team</p>
      </div>
    `,
  });
};

// Wrapper kept for backward compatibility with financeController
const shareholderCapitalPaymentEmail = async (email, firstName) => {
  try {
    return await sendPaymentConfirmationEmail(email, firstName);
  } catch (err) {
    console.error("Error sending shareholder capital email:", err);
    return null;
  }
};

module.exports = {
  sendApprovalEmail,
  sendDisapprovalEmail,
  sendWelcomeEmail,
  sendPaymentConfirmationEmail,
  shareholderCapitalPaymentEmail,
  sendResetPasswordEmail,
};
