import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faTimes } from '@fortawesome/free-solid-svg-icons';

const PaymentStatus = () => {
  // Hard-coded data for demonstration
  const latestPayments = [
    {
      payment_id: 1,
      amount_paid: 5000,
      operations: 2000,
      insurance: 1000,
      savings: 1000,
      loan: 0,
      created_at: '2024-06-01T08:30:00Z',
    },
    {
      payment_id: 2,
      amount_paid: 6000,
      operations: 2500,
      insurance: 1200,
      savings: 1300,
      loan: 0,
      created_at: '2024-06-05T14:20:00Z',
    },
    {
      payment_id: 3,
      amount_paid: 5500,
      operations: 2200,
      insurance: 1100,
      savings: 1200,
      loan: 0,
      created_at: '2024-06-10T10:15:00Z',
    },
  ];

  const userMatatus = [
    {
      plate_number: 'KBA 123X',
      loan: 50000,
      savings: 15000,
      insurance: 5000,
      insurance_expiry: '2024-12-31',
      actions: ['Pay Insurance', 'Add Savings', 'Take Loan'],
    },
    {
      plate_number: 'KCC 456Y',
      loan: 0,
      savings: 20000,
      insurance: 6000,
      insurance_expiry: '2024-11-15',
      actions: ['Pay Insurance', 'Add Savings', 'Take Loan'],
    },
  ];

  return (
    <div className="content-wrapper">
      <div className="container mt-5">
        {/* Latest Payments Table */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h3 className="card-title">Latest Payments</h3>
                <div className="card-tools">
                  <button type="button" className="btn btn-tool text-white" data-card-widget="collapse">
                    <FontAwesomeIcon icon={faMinus} />
                  </button>
                  <button type="button" className="btn btn-tool text-white" data-card-widget="remove">
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="thead-light">
                      <tr>
                        <th>Payment ID</th>
                        <th>Amount</th>
                        <th>Daily Operations</th>
                        <th>Insurance</th>
                        <th>Savings</th>
                        <th>Loan</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestPayments.map((payment) => (
                        <tr key={payment.payment_id}>
                          <td>
                            <Link to={`/users/payments/item/${payment.payment_id}`} className="text-decoration-none">
                              {payment.payment_id}
                            </Link>
                          </td>
                          <td>KES {payment.amount_paid}</td>
                          <td>KES {payment.operations}</td>
                          <td>KES {payment.insurance}</td>
                          <td>KES {payment.savings}</td>
                          <td>{payment.loan > 0 ? `KES ${payment.loan}` : 'No Loan'}</td>
                          <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card-footer clearfix">
                <Link to="/users/payments/new" className="btn btn-sm btn-info float-left">
                  Make New Payment
                </Link>
                <Link to="/users/payments" className="btn btn-sm btn-secondary float-right">
                  View All Transactions
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Management Table */}
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-success text-white">
                <h3 className="card-title">Vehicle Management</h3>
                <div className="card-tools">
                  <button type="button" className="btn btn-tool text-white" data-card-widget="collapse">
                    <FontAwesomeIcon icon={faMinus} />
                  </button>
                  <button type="button" className="btn btn-tool text-white" data-card-widget="remove">
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="thead-light">
                      <tr>
                        <th>Plate Number</th>
                        <th>Loan</th>
                        <th>Savings</th>
                        <th>Insurance Savings</th>
                        <th>Insurance Expiry</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userMatatus.map((matatu, index) => (
                        <tr key={index}>
                          <td>{matatu.plate_number}</td>
                          <td>{matatu.loan > 0 ? `KES ${matatu.loan}` : 'No Loan'}</td>
                          <td>KES {matatu.savings}</td>
                          <td>KES {matatu.insurance}</td>
                          <td>{new Date(matatu.insurance_expiry).toLocaleDateString()}</td>
                          <td>
                            <div className="dropdown">
                              <button
                                className="btn btn-sm btn-secondary dropdown-toggle"
                                type="button"
                                id={`dropdown-${index}`}
                                data-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                              >
                                Actions
                              </button>
                              <div className="dropdown-menu" aria-labelledby={`dropdown-${index}`}>
                                {matatu.actions.map((action, actionIndex) => (
                                  <button key={actionIndex} className="dropdown-item" type="button">
                                    {action}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card-footer text-center">
                <Link to="/users/vehicles" className="btn btn-sm btn-primary">
                  View All Vehicles
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;