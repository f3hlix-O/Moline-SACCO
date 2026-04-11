import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link, useLocation } from "react-router-dom";
import { Tabs, Tab } from "react-bootstrap";
import {
  handleDisapproveLoan,
  handleApproveLoan,
  fetchLoanApplications,
} from "../components/financial";

function AdminLoans() {
  const [allLoans, setAllLoans] = useState([]);
  const [loading, setLoading] = useState(false);

  // Detect current base path: '/admin' vs '/staff'
  const location = useLocation();
  const base = location.pathname.startsWith("/admin") ? "/admin" : "/staff";

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchLoanApplications();
      setLoading(false);
      setAllLoans(data);
    })();
  }, []);

  const profileLink = (userId) => `${base}/users/user_profile/${userId}`;

  const pendingLoans = allLoans.filter(
    (l) => l.status === "pending" || (!l.status && l.amount_issued == 0),
  );
  const approvedLoans = allLoans.filter((l) => l.status === "approved");
  const disapprovedLoans = allLoans.filter((l) => l.status === "disapproved");

  return (
    <div className="content-wrapper">
      <section className="content">
        <div className="container-fluid">
          <Tabs defaultActiveKey="pending" id="loan-tabs">
            <Tab eventKey="pending" title="Pending Loans">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Pending Loan Applications</h3>
                </div>
                <div className="card-body">
                  {loading ? (
                    <div>Loading...</div>
                  ) : pendingLoans.length > 0 ? (
                    <table className="table table-bordered table-hover">
                      <thead>
                        <tr>
                          <th>User Id</th>
                          <th>Type</th>
                          <th>Vehicle</th>
                          <th>Amount Applied</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingLoans.map((app) => (
                          <tr key={app.loan_id}>
                            <td>
                              <Link to={profileLink(app.user_id)}>
                                {app.user_id}
                              </Link>
                            </td>
                            <td>{app.loan_type}</td>
                            <td>{app.matatu_id || "N/A"}</td>
                            <td>{app.amount_applied}</td>
                            <td>Pending</td>
                            <td>
                              <button
                                className="btn btn-success"
                                onClick={() =>
                                  handleApproveLoan(
                                    app.loan_id,
                                    app.loan_type === "emergency",
                                    setAllLoans,
                                    setAllLoans,
                                  )
                                }
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-danger ml-2"
                                onClick={() =>
                                  handleDisapproveLoan(
                                    app.loan_id,
                                    app.loan_type === "emergency",
                                    setAllLoans,
                                    setAllLoans,
                                  )
                                }
                              >
                                Disapprove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div>No pending loan applications</div>
                  )}
                </div>
              </div>
            </Tab>
            <Tab eventKey="approved" title="Approved Loans">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Approved Loans</h3>
                </div>
                <div className="card-body">
                  {loading ? (
                    <div>Loading...</div>
                  ) : approvedLoans.length > 0 ? (
                    <table className="table table-bordered table-hover">
                      <thead>
                        <tr>
                          <th>User Id</th>
                          <th>Type</th>
                          <th>Vehicle</th>
                          <th>Amount Approved</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvedLoans.map((app) => (
                          <tr key={app.loan_id}>
                            <td>
                              <Link to={profileLink(app.user_id)}>
                                {app.user_id}
                              </Link>
                            </td>
                            <td>{app.loan_type}</td>
                            <td>{app.matatu_id || "N/A"}</td>
                            <td>{app.amount_issued}</td>
                            <td>Approved</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div>No approved loans</div>
                  )}
                </div>
              </div>
            </Tab>
            <Tab eventKey="disapproved" title="Disapproved Loans">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Disapproved Loans</h3>
                </div>
                <div className="card-body">
                  {loading ? (
                    <div>Loading...</div>
                  ) : disapprovedLoans.length > 0 ? (
                    <table className="table table-bordered table-hover">
                      <thead>
                        <tr>
                          <th>User Id</th>
                          <th>Type</th>
                          <th>Vehicle</th>
                          <th>Amount Applied</th>
                          <th>Reason</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {disapprovedLoans.map((app) => (
                          <tr key={app.loan_id}>
                            <td>
                              <Link to={profileLink(app.user_id)}>
                                {app.user_id}
                              </Link>
                            </td>
                            <td>{app.loan_type}</td>
                            <td>{app.matatu_id || "N/A"}</td>
                            <td>{app.amount_applied}</td>
                            <td>
                              {app.rejection_reason || "No reason provided"}
                            </td>
                            <td>Disapproved</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div>No disapproved loans</div>
                  )}
                </div>
              </div>
            </Tab>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

export default AdminLoans;
