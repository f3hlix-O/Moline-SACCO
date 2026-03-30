import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchApprovedUsers } from "../admin/components/users";
import { fetchMatatuDetais } from "../admin/components/matatus";
import { fetchFinancialDetails } from "../admin/components/financial";
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
import { Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import StaffDetailsModal from "./StaffDetailsModal";
import axiosInstance from "../context/axiosInstance";
import LoanManagement from "./LoanManagement";
import MatatuManagement from "./MatatuManagement";
import Reports from "./Reports";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  PieController,
  CategoryScale,
  LinearScale,
  BarElement
);

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [position, setPosition] = useState("");
  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState("");

  const [matatus, setMatatus] = useState([]);
  const [financialDetails, setFinancialDetails] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [vehicleStats, setVehicleStats] = useState({});
  const [financialStats, setFinancialStats] = useState({});

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    axiosInstance
      .get("/staff/details")
      .then((response) => response.data)
      .then((userData) => {
        setPosition(userData.position);
        setFirstName(userData.first_name);
        setRole(userData.role);
      })
      .catch((error) => {
        console.error("Error fetching user details:", error);
      });

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
          user.roles.includes("Vehicle Owner")
        ).length,
        drivers: approvedUsersData.filter((user) =>
          user.roles.includes("Driver")
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
        0
      );
      const totalLoans = financialData.reduce(
        (acc, item) => acc + item.loan_amount_due,
        0
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
    <div className="flex min-h-screen bg-gray-100 content-wrapper">
      <div className="flex-1 p-4">
        <div className="card card-info mb-4">
          <div className="card-header">
            <h1 className="card-title">Welcome, {firstName}</h1>
          </div>
          <div className="card-body">
            <p>Position: {position}</p>
            <Link to="/staff/update">
              <Button variant="primary">Update Details</Button>
            </Link>
            <StaffDetailsModal
              showModal={isModalOpen}
              closeModal={closeModal}
            />
          </div>
        </div>

        {/* Charts - Two per row */}
        <div className="row">
          {/* User Statistics */}
          <div className="col-md-6 mb-4">
            <div className="card card-success">
              <div className="card-header">
                <h3 className="card-title">User Statistics</h3>
              </div>
              <div className="card-body">
                <p>Total users: {userStats.total}</p>
                <Pie data={userChartData} />
              </div>
              <div className="card-footer">
                <Link to="#" className="btn btn-sm btn-secondary">
                  Manage Users
                </Link>
              </div>
            </div>
          </div>

          {/* Vehicle Statistics */}
          <div className="col-md-6 mb-4">
            <div className="card card-primary">
              <div className="card-header">
                <h3 className="card-title">Vehicle Statistics</h3>
              </div>
              <div className="card-body">
                <p>Total registered vehicles: {vehicleStats.total}</p>
                <Pie data={matatuChartData} />
              </div>
              <div className="card-footer">
                <Link to="#" className="btn btn-sm btn-secondary">
                  Manage Vehicles
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="card card-warning mb-4">
          <div className="card-header">
            <h3 className="card-title">Financial Overview</h3>
          </div>
          <div className="card-body">
            <p>Total income: KES {financialStats.totalIncome}</p>
            <p>Total expenses: KES {financialStats.totalExpenses}</p>
            <p>Outstanding loans: KES {financialStats.outstandingLoans}</p>
            <p>Total savings: KES {financialStats.totalSavings}</p>
          </div>
        </div>

        {/* Monthly Loans and Savings */}
        <div className="card card-secondary mb-4">
          <div className="card-header">
            <h3 className="card-title">Monthly Loans and Savings</h3>
          </div>
          <div className="card-body" style={{ height: "400px" }}>
            <Bar data={financialChartData} options={financialChartOptions} />
          </div>
        </div>

        {/* Quick Links */}
        <div className="card card-dark">
          <div className="card-header">
            <h3 className="card-title">Quick Links</h3>
          </div>
          <div className="card-body">
            <ul className="list-group">
              <li className="list-group-item">
                <Link
                  to="#"
                  className="text-decoration-none text-primary"
                >
                  View Expenses
                </Link>
              </li>
              <li className="list-group-item">
                <Link
                  to="#"
                  className="text-decoration-none text-primary"
                >
                  View Pending Loans
                </Link>
              </li>
              <li className="list-group-item">
                <Link
                  to="#"
                  className="text-decoration-none text-primary"
                >
                  Add Expenses
                </Link>
              </li>
              <li className="list-group-item">
                <Link
                  to="/salary/advance"
                  className="text-decoration-none text-primary"
                >
                  Pay Salary (Advance)
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
