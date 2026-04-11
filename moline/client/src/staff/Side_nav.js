import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Nav } from 'react-bootstrap';
import matisLogo from '../assets/matis-logo.png';

function Sidenav() {
  const { user } = useUser();

  const [openDropdown, setOpenDropdown] = useState({
    salaryManagement: false,
    loanManagement: false,
    expenseTracking: false,
    matatuManagement: false,
    reports: false,
  });

  const toggleDropdown = (section) => {
    setOpenDropdown((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <aside className="main-sidebar sidebar-dark-primary elevation-4">
      {/* Brand Logo */}
      <Link to="#" className="brand-link">
        <img src={matisLogo} alt="MaTIS Logo" className="brand-image img-circle elevation-3" style={{ opacity: '.8' }} />
        <span className="brand-text font-weight-light">Moline SACCO system</span>
      </Link>
      {/* Sidebar */}
      <div className="sidebar">
        {/* Sidebar user panel (optional) */}
        <div className="user-panel mt-3 pb-3 mb-3 d-flex">
          <div className="image">
            <img src="dist/img/user.jpg" className="img-circle elevation-2" alt="User Image" />
          </div>
          <div className="info">
            <Link to="#" className="d-block">{user ? user.name : 'User'}</Link>
          </div>
        </div>
        {/* SidebarSearch Form */}
        <div className="form-inline">
          <div className="input-group" data-widget="sidebar-search">
            <input className="form-control form-control-sidebar" type="search" placeholder="Search" aria-label="Search" />
            <div className="input-group-append">
              <button className="btn btn-sidebar">
                <i className="fas fa-search fa-fw" />
              </button>
            </div>
          </div>
        </div>
        {/* Sidebar Menu */}
        <nav className="mt-2">
          <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
            <li className="nav-item">
              <Link to="/staff/dashboard" className="nav-link">
                <i className="nav-icon fas fa-tachometer-alt" />
                <p>Dashboard</p>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/staff/update" className="nav-link">
                <i className="nav-icon fas fa-money-check-alt" />
                <p>Staff Details</p>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/staff/salary" className="nav-link">
                <i className="nav-icon fas fa-money-check-alt" />
                <p>Salary Management</p>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/staff/loanmanagement" className="nav-link">
                <i className="nav-icon fas fa-hand-holding-usd" />
                <p>Loan Management</p>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/staff/expensetracking" className="nav-link">
                <i className="nav-icon fas fa-receipt" />
                <p>Expense Tracking</p>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/staff/matatumanagement" className="nav-link">
                <i className="nav-icon fas fa-bus" />
                <p>Matatu Management</p>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/staff/reports" className="nav-link">
                <i className="nav-icon fas fa-file-alt" />
                <p>Reports</p>
              </Link>
            </li>
          </ul>
        </nav>
        {/* /.sidebar-menu */}
      </div>
      {/* /.sidebar */}
    </aside>
  );
}

export default Sidenav;
