import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchApprovedUsers } from "../components/users";
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
    scales: {
      y: {
        beginAtZero: true,
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
                      to="/Admin/users"
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
                      to="/Admin/fleet"
                      className="btn btn-sm btn-secondary"
                    >
                      Manage Vehicles
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {/* Financial Overview */}
            <div className="row">
              <div className="col-md-12">
                <div className="card card-danger">
                  <div className="card-header">
                    <h3 className="card-title">Financial Overview</h3>
                  </div>
                  <div className="card-body">
                    <p>Total income: KES {financialStats.totalIncome}</p>
                    <p>Total expenses: KES {financialStats.totalExpenses}</p>
                    <p>
                      Outstanding loans: KES {financialStats.outstandingLoans}
                    </p>
                    <p>Total savings: KES {financialStats.totalSavings}</p>
                  </div>
                  <div className="card-footer">
                    <Link
                      to="/Admin/financials"
                      className="btn btn-sm btn-secondary"
                    >
                      Manage Financials
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-12">
                <div className="card card-success">
                  <div className="card-header">
                    <h3 className="card-title">Monthly Loans and Savings</h3>
                  </div>
                  <div className="card-body">
                    <div style={{ height: "400px" }}>
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
                        <Link to="/Admin/users/approve" className="nav-link">
                          Approve or Reject User Registrations
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/Admin/users/roles" className="nav-link">
                          Assign or Modify User Roles
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/Admin/users/profiles" className="nav-link">
                          Access User Profiles
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
                        <Link to="/Admin/fleet" className="nav-link">
                          View and Manage Vehicle Registrations
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/Admin/fleet/statuses" className="nav-link">
                          Monitor Vehicle Statuses
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link
                          to="/Admin/fleet/assignments"
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
                        <Link to="/Admin/transactions" className="nav-link">
                          Manage Financial Transactions
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/Admin/loans" className="nav-link">
                          Approve Loan Applications
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/Admin/savings" className="nav-link">
                          Monitor Savings and Loan Statuses
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            {/* Reports Section */}
            <div className="row">
              <div className="col-md-12">
                <div className="card card-primary">
                  <div className="card-header">
                    <h3 className="card-title">Reports Section</h3>
                  </div>
                  <div className="card-body">
                    <ul className="nav flex-column">
                      <li className="nav-item">
                        <Link to="/reports/users" className="nav-link">
                          Users Reports
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/reports/vehicles" className="nav-link">
                          Fleet Reports
                        </Link>
                      </li>
                      <li className="nav-item">
                        <Link to="/reports/financials" className="nav-link">
                          Financial Reports
                        </Link>
                      </li>
                    </ul>
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
