import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../../context/axiosInstance";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/finance/payments/user");
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content" style={{ minHeight: "100vh" }}>
      <section className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div
                className="card"
                style={{
                  height: "calc(100vh - 200px)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div className="card-header">
                  <h3 className="card-title">My Payments</h3>
                  <div className="card-tools">
                    <Link
                      to="/users/vehicles"
                      className="btn btn-primary btn-sm"
                    >
                      Make Daily Remittance
                    </Link>
                  </div>
                </div>
                <div
                  className="card-body"
                  style={{ flex: 1, overflow: "auto" }}
                >
                  {loading ? (
                    <div className="text-center">Loading...</div>
                  ) : payments.length > 0 ? (
                    <div
                      className="table-responsive"
                      style={{ height: "100%" }}
                    >
                      <table
                        className="table table-bordered table-hover"
                        style={{ marginBottom: 0 }}
                      >
                        <thead>
                          <tr>
                            <th>Payment ID</th>
                            <th>Amount Paid</th>
                            <th>Operations</th>
                            <th>Insurance</th>
                            <th>Savings</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment) => (
                            <tr key={payment.payment_id}>
                              <td>{payment.payment_id}</td>
                              <td>KES {payment.amount_paid}</td>
                              <td>KES {payment.operations}</td>
                              <td>KES {payment.insurance}</td>
                              <td>KES {payment.savings}</td>
                              <td>
                                {new Date(
                                  payment.created_at,
                                ).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center" style={{ padding: "50px" }}>
                      No payments found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Payments;
