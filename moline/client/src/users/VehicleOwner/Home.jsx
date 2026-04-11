import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../context/axiosInstance";

function VehicleOwnerHome() {
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [totalLoans, setTotalLoans] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [monthlyReport, setMonthlyReport] = useState({});
  const [latestPayments, setLatestPayments] = useState([]);
  const [ownerInfo, setOwnerInfo] = useState({ userInfo: {}, matatus: [] });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTotalLoans();
    fetchTotalSavings();
    fetchMonthlyReport();
    fetchLatestPayments();
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      await fetchTotalVehicles(setOwnerInfo, setError);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (ownerInfo.matatus) {
      setTotalVehicles(ownerInfo.matatus.length);
    }
  }, [ownerInfo]);

  // Refetch loan total when page becomes visible (e.g., after repayment processing)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        try {
          await fetchTotalLoans();
          await fetchTotalSavings();
        } catch (err) {
          console.error("Error refetching totals on visibility change:", err);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const fetchTotalVehicles = async () => {
    try {
      const [userInfo, matatus] = await Promise.all([
        axiosInstance.get("/matatus/profile"),
        axiosInstance.get("/matatus/userMatatus"),
      ]);

      setOwnerInfo({
        userInfo: userInfo.data,
        matatus: matatus.data,
      });
    } catch (error) {
      setError("Failed to fetch owner information");
    }
  };
  const fetchTotalLoans = async () => {
    try {
      const response = await axiosInstance.get("finance/loans/total");
      const data = await response.data;
      setTotalLoans(data.totalLoans);
    } catch (error) {
      console.error("Error fetching total loans:", error);
    }
  };

  const fetchTotalSavings = async () => {
    try {
      const response = await axiosInstance.get("/finance/savings/total");
      const data = await response.data;
      setTotalSavings(data.totalSavings);
    } catch (error) {
      console.error("Error fetching total savings:", error);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/reports/monthly",
        {
          method: "GET",
          credentials: "include",
          headers: {
            authorization: `${sessionStorage.getItem("userId")}`,
          },
        },
      );
      const data = await response.json();
      setMonthlyReport(data);
    } catch (error) {
      console.error("Error fetching monthly report:", error);
    }
  };

  const fetchLatestPayments = async () => {
    try {
      const response = await axiosInstance.get("/finance/payments/latest");
      const data = await response.data;
      setLatestPayments(data.payments);
    } catch (error) {
      console.error("Error fetching latest payments:", error);
    }
  };

  return (
    <div className="page-content">
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">Dashboard</h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item">
                  <a href="#">Home</a>
                </li>
                <li className="breadcrumb-item active">Dashboard</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
      {/* Main content */}
      <section className="content">
        <div className="container-fluid">
          {/* Info boxes */}
          <div className="row">
            <div className="col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
              <Link to="/users/vehicles" className="text-decoration-none">
                <div className="info-box">
                  <span className="info-box-icon bg-info elevation-1">
                    <i className="fas fa-car"></i>
                  </span>
                  <div className="info-box-content">
                    <span className="info-box-text">Total Vehicles</span>
                    <span className="info-box-number">{totalVehicles}</span>
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
              <Link
                to="/users/financial-status"
                className="text-decoration-none"
              >
                <div className="info-box">
                  <span className="info-box-icon bg-danger elevation-1">
                    <i className="fas fa-money-bill-wave"></i>
                  </span>
                  <div className="info-box-content">
                    <span className="info-box-text">Total Loans</span>
                    <span className="info-box-number">KES: {totalLoans}</span>
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
              <Link
                to="/users/financial-status"
                className="text-decoration-none"
              >
                <div className="info-box">
                  <span className="info-box-icon bg-success elevation-1">
                    <i className="fas fa-piggy-bank"></i>
                  </span>
                  <div className="info-box-content">
                    <span className="info-box-text">Total Savings</span>
                    <span className="info-box-number">KES: {totalSavings}</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Monthly Recap Report */}
          <div className="row">
            <div className="col-md-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title">Monthly Recap Report</h5>
                  <div className="card-tools">
                    <button
                      type="button"
                      className="btn btn-tool"
                      data-card-widget="collapse"
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <div className="btn-group">
                      <button
                        type="button"
                        className="btn btn-tool dropdown-toggle"
                        data-toggle="dropdown"
                      >
                        <i className="fas fa-wrench"></i>
                      </button>
                      <div
                        className="dropdown-menu dropdown-menu-right"
                        role="menu"
                      >
                        <a href="#" className="dropdown-item">
                          Action
                        </a>
                        <a href="#" className="dropdown-item">
                          Separated link
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-tool"
                      data-card-widget="remove"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                <div className="card-footer">
                  <div className="row">
                    <div className="col-sm-4 col-6">
                      <div className="description-block border-right">
                        <span className="description-percentage text-success">
                          <i className="fas fa-caret-up"></i> 17%
                        </span>
                        <h5 className="description-header">
                          KES: {monthlyReport.totalSavings}
                        </h5>
                        <span className="description-text">TOTAL SAVINGS</span>
                      </div>
                    </div>
                    <div className="col-sm-4 col-6">
                      <div className="description-block border-right">
                        <span className="description-percentage text-warning">
                          <i className="fas fa-caret-left"></i> 0%
                        </span>
                        <h5 className="description-header">
                          KES: {monthlyReport.totalLoans}
                        </h5>
                        <span className="description-text">
                          TOTAL LOAN BALANCE
                        </span>
                      </div>
                    </div>
                    <div className="col-sm-4 col-12 mt-3 mt-sm-0">
                      <div className="description-block">
                        <span className="description-percentage text-success">
                          <i className="fas fa-caret-up"></i> 20%
                        </span>
                        <h5 className="description-header">
                          KES: {monthlyReport.insuranceBalance}
                        </h5>
                        <span className="description-text">
                          INSURANCE BALANCE
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Latest Payments */}
          <div className="row">
            <div className="col-lg-8 col-md-12">
              <div className="card">
                <div className="card-header border-transparent">
                  <h3 className="card-title">Latest Payments</h3>
                  <div className="card-tools">
                    <button
                      type="button"
                      className="btn btn-tool"
                      data-card-widget="collapse"
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-tool"
                      data-card-widget="remove"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table m-0">
                      <thead>
                        <tr>
                          <th>Payment ID</th>
                          <th>Amount</th>
                          <th>daily operations</th>
                          <th>Insurance</th>
                          <th>Savings</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestPayments.length > 0 ? (
                          latestPayments.map((payment) => (
                            <tr key={payment.payment_id}>
                              <td>
                                <Link
                                  to={`/users/payments/item/${payment.payment_id}`}
                                >
                                  {payment.payment_id}
                                </Link>
                              </td>
                              <td>{payment.amount_paid}</td>
                              <td>{payment.operations}</td>
                              <td>{payment.insurance}</td>
                              <td>{payment.savings}</td>
                              <td>
                                {new Date(
                                  payment.created_at,
                                ).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6">No payments found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card-footer clearfix"></div>
              </div>
            </div>
            <div className="col-lg-4 col-md-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Vehicle Management</h3>
                  <div className="card-tools">
                    <button
                      type="button"
                      className="btn btn-tool"
                      data-card-widget="collapse"
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-tool"
                      data-card-widget="remove"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                <div className="card-body p-0">
                  {/* kept empty intentionally - actions moved to footer for centered layout */}
                </div>
                <div className="card-footer">
                  <div className="d-flex justify-content-center align-items-center gap-3">
                    <Link to="/users/addVehicle" className="btn btn-primary">
                      Add New Vehicle
                    </Link>
                    <Link to="/users/vehicles" className="btn btn-success">
                      View All Vehicles
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default VehicleOwnerHome;
