import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  fetchApprovedUsers,
  fetchWithdrawalRequests,
} from "../components/users";
import { fetchMatatuDetais } from "../components/matatus";
import { fetchFinancialDetails } from "../components/financial";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  PieController,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  PieController,
  CategoryScale,
  LinearScale,
  BarElement,
);

function AdminPanel() {
  const [matatus, setMatatus] = useState([]);
  const [financialDetails, setFinancialDetails] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [vehicleStats, setVehicleStats] = useState({});
  const [financialStats, setFinancialStats] = useState({});

  useEffect(() => {
    const initializeData = async () => {
      const matatusData = await fetchMatatuDetais();
      setMatatus(matatusData);

      const financialData = await fetchFinancialDetails();
      setFinancialDetails(financialData);

      const approvedUsersData = await fetchApprovedUsers();
      setApprovedUsers(approvedUsersData);

      const withdrawalData = await fetchWithdrawalRequests();
      setWithdrawals(withdrawalData || []);

      const userStats = {
        total: approvedUsersData.length,
        admins: approvedUsersData.filter((user) => user.roles.includes("Admin"))
          .length,
        staff: approvedUsersData.filter((user) => user.roles.includes("Staff"))
          .length,
        vehicleOwners: approvedUsersData.filter((user) =>
          user.roles.includes("Vehicle Owner"),
        ).length,
        drivers: approvedUsersData.filter((user) =>
          user.roles.includes("Driver"),
        ).length,
      };
      setUserStats(userStats);

      const vehicleStats = {
        total: matatusData.length,
        active: matatusData.filter((matatu) => matatu.status === "active")
          .length,
        inactive: matatusData.filter((matatu) => matatu.status === "inactive")
          .length,
        suspended: matatusData.filter((matatu) => matatu.status === "suspended")
          .length,
      };
      setVehicleStats(vehicleStats);

      const totalSavings = financialData.reduce(
        (acc, item) => acc + item.savings_amount,
        0,
      );
      const totalLoans = financialData.reduce(
        (acc, item) => acc + item.loan_amount_due,
        0,
      );

      const financialStats = {
        totalIncome: totalSavings,
        totalExpenses: 800000,
        outstandingLoans: totalLoans,
        totalSavings,
      };
      setFinancialStats(financialStats);
    };
    initializeData();
  }, []);

  const userChartData = {
    labels: ["Admins", "Staff", "Vehicle Owners", "Drivers"],
    datasets: [
      {
        data: [
          userStats.admins,
          userStats.staff,
          userStats.vehicleOwners,
          userStats.drivers,
        ],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
      },
    ],
  };
  const matatuChartData = {
    labels: ["Active", "Inactive", "Suspended"],
    datasets: [
      {
        data: [
          vehicleStats.active,
          vehicleStats.inactive,
          vehicleStats.suspended,
        ],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
      },
    ],
  };

  const financialChartData = {
    labels: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    datasets: [
      {
        label: "Loans",
        data: [40, 55, 75, 50, 85, 60, 90, 70, 50, 65, 55, 80],
        backgroundColor: "rgba(255, 99, 132, 0.8)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "Savings",
        data: [60, 70, 80, 40, 65, 45, 85, 55, 40, 60, 75, 90],
        backgroundColor: "rgba(54, 162, 235, 0.8)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const financialChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        padding: 12,
        titleColor: "#ffffff",
        bodyColor: "#e2e8f0",
        displayColors: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(148, 163, 184, 0.18)",
        },
        ticks: {
          color: "#64748b",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#64748b",
        },
      },
    },
  };

  return (
    <div>
      {/* Content Wrapper. Contains page content */}
      <div className="content-wrapper">
        {/* Content Header (Page header) */}
        <div className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="m-0">Admin Dashboard</h1>
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item">
                    <Link to="/admin/adminpanel">Home</Link>
                  </li>
                  <li className="breadcrumb-item active">
                    Moline Matatu SACCO management System
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
        {/* Main content */}
        <section className="content">
          <div className="container-fluid">
            {/* User Statistics */}
            <div className="row">
              <div className="col-md-6">
                <div className="card card-success">
                  <div className="card-header">
                    <h3 className="card-title">User Statistics</h3>
                  </div>
                  <div className="card-body">
                    <p>Total users: {userStats.total}</p>
                    <Pie data={userChartData} />
                  </div>
                  <div className="card-footer">
                    <Link
                      to="/admin/users"
                      className="btn btn-sm btn-secondary"
                    >
                      Manage Users
                    </Link>
                  </div>
                </div>
              </div>
              {/* Vehicle Statistics */}
              <div className="col-md-6">
                <div className="card card-primary">
                  <div className="card-header">
                    <h3 className="card-title">Vehicle Statistics</h3>
                  </div>
                  <div className="card-body">
                    <p>Total registered vehicles: {vehicleStats.total}</p>
                    <Pie data={matatuChartData} />
                  </div>
                  <div className="card-footer">
                    <Link
                      to="/admin/fleet"
                      className="btn btn-sm btn-secondary"
                    >
                      Manage Vehicles
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-12">
                <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                  <div
                    className="card-header d-flex flex-column flex-md-row align-items-md-center justify-content-between"
                    style={{
                      background:
                        "linear-gradient(135deg, #0f766e 0%, #1d4ed8 100%)",
                      color: "#ffffff",
                      borderBottom: "0",
                    }}
                  >
                    <div>
                      <h3 className="card-title mb-1">
                        Monthly Loans and Savings
                      </h3>
                      <small style={{ color: "rgba(255,255,255,0.85)" }}>
                        A month-by-month view of lending and savings activity.
                      </small>
                    </div>
                    <span className="badge bg-light text-dark px-3 py-2 mt-3 mt-md-0">
                      Live portfolio trend
                    </span>
                  </div>
                  <div className="card-body" style={{ background: "#f8fafc" }}>
                    <div className="row g-3 mb-4">
                      <div className="col-md-4">
                        <div className="rounded-4 bg-white border p-3 h-100">
                          <div className="text-uppercase text-muted small mb-1">
                            Total savings
                          </div>
                          <div className="fw-bold fs-4 text-success">
                            KES {financialStats.totalSavings}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="rounded-4 bg-white border p-3 h-100">
                          <div className="text-uppercase text-muted small mb-1">
                            Outstanding loans
                          </div>
                          <div className="fw-bold fs-4 text-primary">
                            KES {financialStats.outstandingLoans}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="rounded-4 bg-white border p-3 h-100">
                          <div className="text-uppercase text-muted small mb-1">
                            Monthly snapshot
                          </div>
                          <div className="fw-bold fs-4 text-dark">
                            Loans vs savings
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      className="bg-white border rounded-4 p-3 p-md-4"
                      style={{ height: "420px" }}
                    >
                      <Bar
                        data={financialChartData}
                        options={financialChartOptions}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Quick Actions Section */}
            <div className="row">
              <div className="col-md-4">
                <div className="card card-success">
                  <div className="card-header">
                    <h3 className="card-title">User Management</h3>
                  </div>
                  <div className="card-body">
                    <ul className="nav flex-column">
                      <li className="nav-item">
                        <Link to="/admin/users/approve" className="nav-link">
                          Approve or Reject User Registrations
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/admin/users/roles" className="nav-link">
                          Assign or Modify User Roles
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/admin/users/profiles" className="nav-link">
                          Access User Profiles
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/admin/users" className="nav-link">
                          View Withdrawal Submissions
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card card-success">
                  <div className="card-header">
                    <h3 className="card-title">Vehicle Management</h3>
                  </div>
                  <div className="card-body">
                    <ul className="nav flex-column">
                      <li className="nav-item">
                        <Link to="/admin/fleet" className="nav-link">
                          View and Manage Vehicle Registrations
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/admin/fleet/statuses" className="nav-link">
                          Monitor Vehicle Statuses
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="/admin/fleet/assignments"
                          className="nav-link"
                        >
                          Assign or Change Drivers and Conductors
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card card-success">
                  <div className="card-header">
                    <h3 className="card-title">Financial Management</h3>
                  </div>
                  <div className="card-body">
                    <ul className="nav flex-column">
                      <li className="nav-item">
                        <Link to="/admin/loans" className="nav-link">
                          Approve Loan Applications
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/admin/savings" className="nav-link">
                          Monitor Savings and Loan Statuses
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-12">
                <div className="card card-info shadow-sm">
                  <div className="card-header">
                    <h3 className="card-title">
                      Latest Withdrawal Submissions
                    </h3>
                  </div>
                  <div className="card-body table-responsive p-0">
                    <table className="table table-striped table-hover align-middle text-nowrap mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>User</th>
                          <th>Reason</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.slice(0, 5).map((withdrawal) => (
                          <tr key={withdrawal.withdrawal_id}>
                            <td className="fw-semibold">
                              #{withdrawal.withdrawal_id}
                            </td>
                            <td>{withdrawal.user_name}</td>
                            <td>{withdrawal.reason}</td>
                            <td>
                              <span
                                className={`badge ${withdrawal.status === "approved" ? "bg-success" : withdrawal.status === "rejected" ? "bg-danger" : "bg-warning text-dark"}`}
                              >
                                {(withdrawal.status || "pending").toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {withdrawals.length === 0 && (
                          <tr>
                            <td colSpan="4" className="text-center py-3">
                              No withdrawal submissions yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="card-footer">
                    <Link
                      to="/admin/users"
                      className="btn btn-sm btn-secondary"
                    >
                      Open Full User Management View
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminPanel;
