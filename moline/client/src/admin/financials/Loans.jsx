import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useLocation } from 'react-router-dom';
import {
  handleDisapproveLoan,
  handleApproveLoan,
  fetchLoanApplications
} from '../components/financial';

function AdminLoans() {
  const [normalLoans, setNormalLoans] = useState([]);
  const [emergencyLoans, setEmergencyLoans] = useState([]);
  const [loading, setLoading] = useState(false);

  // Detect current base path: '/admin' vs '/staff'
  const location = useLocation();
  const base = location.pathname.startsWith('/admin') ? '/admin' : '/staff';

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchLoanApplications();
      setLoading(false);

      setNormalLoans(data.filter(l => l.loan_type === 'normal'));
      setEmergencyLoans(data.filter(l => l.loan_type === 'emergency'));
    })();
  }, []);

  const profileLink = (userId) => `${base}/users/user_profile/${userId}`;

  return (
    <div className="content-wrapper">
      <section className="content">
        <div className="container-fluid">
          {/** Normal Loans **/}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Normal Loan Applications</h3>
            </div>
            <div className="card-body">
              {loading ? (
                <div>Loading...</div>
              ) : normalLoans.length > 0 ? (
                <table className="table table-bordered table-hover">
                  <thead>
                    <tr>
                      <th>User Id</th>
                      <th>Vehicle</th>
                      <th>Amount Applied</th>
                      <th>Savings Balance</th>
                      <th>Unpaid Loan</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalLoans.map(app => (
                      <tr key={app.loan_id}>
                        <td>
                          <Link to={profileLink(app.user_id)}>
                            {app.user_id}
                          </Link>
                        </td>
                        <td>{app.matatu_id}</td>
                        <td>{app.amount_applied}</td>
                        <td>KES {app.savings}</td>
                        <td>{app.hasUnpaidLoan ? 'Yes' : 'No'}</td>
                        <td>
                          <button
                            className="btn btn-success"
                            onClick={() =>
                              handleApproveLoan(
                                app.loan_id,
                                false,
                                setNormalLoans,
                                setEmergencyLoans
                              )
                            }
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger ml-2"
                            onClick={() =>
                              handleDisapproveLoan(app.loan_id, false)
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
                <div>No pending normal loan applications</div>
              )}
            </div>
          </div>

          {/** Emergency Loans **/}
          <div className="card mt-4">
            <div className="card-header">
              <h3 className="card-title">Emergency Loan Applications</h3>
            </div>
            <div className="card-body">
              {loading ? (
                <div>Loading...</div>
              ) : emergencyLoans.length > 0 ? (
                <table className="table table-bordered table-hover">
                  <thead>
                    <tr>
                      <th>Name (User Id)</th>
                      <th>Vehicle</th>
                      <th>Amount Applied</th>
                      <th>Savings Balance</th>
                      <th>Unpaid Loan</th>
                      <th>Guarantor</th>
                      <th>Guarantor Savings</th>
                      <th>Guarantor Pending Loan</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emergencyLoans.map(app => (
                      <tr key={app.loan_id}>
                        <td>
                          <Link to={profileLink(app.user_id)}>
                            {app.user_id}
                          </Link>
                        </td>
                        <td>{app.matatu_id}</td>
                        <td>{app.amount_applied}</td>
                        <td>KES {app.savings}</td>
                        <td>{app.hasUnpaidLoan ? 'Yes' : 'No'}</td>
                        <td>{app.guarantor}</td>
                        <td>KES {app.guarantor_savings}</td>
                        <td>{app.guarantorHasUnpaidLoan ? 'Yes' : 'No'}</td>
                        <td>
                          <button
                            className="btn btn-success"
                            onClick={() =>
                              handleApproveLoan(
                                app.loan_id,
                                true,
                                setNormalLoans,
                                setEmergencyLoans
                              )
                            }
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger ml-2"
                            onClick={() =>
                              handleDisapproveLoan(app.loan_id, true)
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
                <div>No pending emergency loan applications</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminLoans;
