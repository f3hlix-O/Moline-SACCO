const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { pool } = require("../config/database");
const { sendWithdrawalStatusEmail } = require("../utils/mailer");

const secretKey = "Vv2N9SCG8RncrDGvfOYlFkaRpm25MA3mRaSCtjPcke4=";

const getAuthorizedUser = async (req) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return null;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    return null;
  }

  if (!decoded || !decoded.user_id) {
    return null;
  }

  const rows = await pool.query(
    "SELECT user_id, first_name, last_name, email, password FROM Users WHERE user_id = ? LIMIT 1",
    [decoded.user_id],
  );

  if (!rows || rows.length === 0) {
    return null;
  }

  return rows[0];
};

const verifyPassword = async (storedPassword, providedPassword) => {
  const stored = storedPassword || "";
  try {
    if (typeof stored === "string" && stored.startsWith("$2")) {
      return await bcrypt.compare(providedPassword, stored);
    }

    return providedPassword === stored;
  } catch (error) {
    return false;
  }
};

const submitWithdrawal = async (req, res) => {
  try {
    const { reason, password } = req.body || {};

    if (!reason || String(reason).trim() === "") {
      return res.status(400).json({ error: "Reason is required" });
    }

    if (!password || String(password).trim() === "") {
      return res.status(400).json({ error: "Password is required" });
    }

    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const passwordOk = await verifyPassword(user.password, password);
    if (!passwordOk) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const userName =
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.email ||
      `User ${user.user_id}`;
    const normalizedReason = String(reason).trim();
    const defaultAmount = 0;

    const insertResult = await pool.query(
      `
        INSERT INTO withdrawals (user_id, user_name, amount, reason, status)
        VALUES (?, ?, ?, ?, 'pending')
      `,
      [user.user_id, userName, defaultAmount, normalizedReason],
    );

    return res.status(201).json({
      message: "Form submitted successfully",
      withdrawal: {
        withdrawal_id: insertResult.insertId,
        user_id: user.user_id,
        user_name: userName,
        email: user.email || "",
        amount: defaultAmount,
        reason: normalizedReason,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Error handling withdrawal form:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAdminWithdrawals = async (req, res) => {
  try {
    const rows = await pool.query(
      `
        SELECT
          w.withdrawal_id,
          w.user_id,
          w.user_name,
          w.amount,
          u.email,
          w.reason,
          w.status,
          w.vehicle_reference,
          w.account_reference,
          w.submitted_at AS created_at,
          w.updated_at
        FROM withdrawals w
        LEFT JOIN Users u ON u.user_id = w.user_id
        ORDER BY w.submitted_at DESC, w.withdrawal_id DESC
      `,
    );

    return res.json(rows || []);
  } catch (error) {
    console.error("Error fetching withdrawal submissions:", error);
    return res.status(500).json({
      error: "An error occurred while fetching withdrawal submissions",
    });
  }
};

const updateWithdrawalStatus = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { status } = req.body || {};
    const normalizedStatus = String(status || "").toLowerCase();

    if (!withdrawalId) {
      return res.status(400).json({ error: "Withdrawal ID is required" });
    }

    if (!["approved", "rejected"].includes(normalizedStatus)) {
      return res.status(400).json({ error: "Valid status is required" });
    }

    const result = await pool.query(
      `
        UPDATE withdrawals
        SET status = ?
        WHERE withdrawal_id = ?
      `,
      [normalizedStatus, withdrawalId],
    );

    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: "Withdrawal submission not found" });
    }

    const updatedRows = await pool.query(
      `
        SELECT
          w.withdrawal_id,
          w.user_id,
          w.user_name,
          w.amount,
          u.email,
          w.reason,
          w.status,
          w.vehicle_reference,
          w.account_reference,
          w.submitted_at AS created_at,
          w.updated_at
        FROM withdrawals w
        LEFT JOIN Users u ON u.user_id = w.user_id
        WHERE w.withdrawal_id = ?
        LIMIT 1
      `,
      [withdrawalId],
    );

    const updatedWithdrawal =
      updatedRows && updatedRows.length > 0 ? updatedRows[0] : null;
    if (normalizedStatus === "approved" && updatedWithdrawal) {
      await new Promise((resolve, reject) => {
        pool.getConnection((connectionError, connection) => {
          if (connectionError) {
            reject(connectionError);
            return;
          }

          connection.beginTransaction((transactionError) => {
            if (transactionError) {
              connection.release();
              reject(transactionError);
              return;
            }

            connection.query(
              "DELETE FROM user_role WHERE user_id = ?",
              [updatedWithdrawal.user_id],
              (roleDeleteError) => {
                if (roleDeleteError) {
                  return connection.rollback(() => {
                    connection.release();
                    reject(roleDeleteError);
                  });
                }

                connection.query(
                  "UPDATE matatus SET driver_id = NULL WHERE driver_id = ?",
                  [updatedWithdrawal.user_id],
                  (driverUpdateError) => {
                    if (driverUpdateError) {
                      return connection.rollback(() => {
                        connection.release();
                        reject(driverUpdateError);
                      });
                    }

                    connection.query(
                      "DELETE FROM drivers WHERE owner_id = ?",
                      [updatedWithdrawal.user_id],
                      (driverDeleteError) => {
                        if (driverDeleteError) {
                          return connection.rollback(() => {
                            connection.release();
                            reject(driverDeleteError);
                          });
                        }

                        connection.query(
                          "DELETE FROM matatus WHERE owner_id = ?",
                          [updatedWithdrawal.user_id],
                          (matatuDeleteError) => {
                            if (matatuDeleteError) {
                              return connection.rollback(() => {
                                connection.release();
                                reject(matatuDeleteError);
                              });
                            }

                            connection.query(
                              "DELETE FROM Users WHERE user_id = ?",
                              [updatedWithdrawal.user_id],
                              (userDeleteError) => {
                                if (userDeleteError) {
                                  return connection.rollback(() => {
                                    connection.release();
                                    reject(userDeleteError);
                                  });
                                }

                                connection.commit((commitError) => {
                                  if (commitError) {
                                    return connection.rollback(() => {
                                      connection.release();
                                      reject(commitError);
                                    });
                                  }

                                  connection.release();
                                  resolve();
                                });
                              },
                            );
                          },
                        );
                      },
                    );
                  },
                );
              },
            );
          });
        });
      });
    }

    if (updatedWithdrawal && updatedWithdrawal.email) {
      const recipientName =
        updatedWithdrawal.user_name || updatedWithdrawal.email;
      await sendWithdrawalStatusEmail(
        updatedWithdrawal.email,
        recipientName,
        normalizedStatus,
        updatedWithdrawal.withdrawal_id,
        updatedWithdrawal.reason,
      );
    }

    return res.json({
      message: `Withdrawal ${normalizedStatus} successfully`,
      withdrawal: updatedWithdrawal,
    });
  } catch (error) {
    console.error("Error updating withdrawal status:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while updating withdrawal status" });
  }
};

module.exports = {
  submitWithdrawal,
  getAdminWithdrawals,
  updateWithdrawalStatus,
};
