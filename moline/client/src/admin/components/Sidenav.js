import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Sidenav.css";
import matisLogo from "../../assets/matis-logo.png";

// Dynamic Sidebar Search Component
function SidebarSearch({ placeholder = "Search", onSearch }) {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="form-inline">
      <div className="input-group" data-widget="sidebar-search">
        <input
          className="form-control form-control-sidebar"
          type="search"
          placeholder={placeholder}
          aria-label={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="input-group-append">
          <button className="btn btn-sidebar" onClick={handleSearch}>
            <i className="fas fa-search fa-fw" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Sidenav() {
  const [openDropdown, setOpenDropdown] = useState({
    userManagement: false,
    vehicleManagement: false,
    financialManagement: false,
    reports: false,
  });

  const toggleDropdown = (section) => {
    setOpenDropdown((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Example search handler
  const handleSearch = (query) => {
    console.log("Searching for:", query);
  };

  return (
    <aside className="main-sidebar sidebar-dark-primary elevation-4 custom-sidenav">
      {/* Brand Logo */}
      <Link to="#" className="brand-link">
        <img
          src={matisLogo}
          alt="Moline Logo"
          className="brand-image img-circle elevation-3"
          style={{ opacity: ".8" }}
        />
        <span className="brand-text font-weight-light">Moline system</span>
      </Link>

      {/* Sidebar */}
      <div className="sidebar">
        {/* Sidebar user panel (optional) */}
        <div className="user-panel mt-3 pb-3 mb-3 d-flex">
          <div className="image">
            <img
              src="dist/img/user.jpg"
              className="img-circle elevation-2"
              alt="User Image"
            />
          </div>
          <div className="info">
            <Link to="#" className="d-block">
              Super Admin
            </Link>
          </div>
        </div>

        {/* Dynamic Sidebar Search */}
        <SidebarSearch placeholder="Search" onSearch={handleSearch} />

        {/* Sidebar Menu */}
        <nav className="mt-2">
          <ul
            className="nav nav-pills nav-sidebar flex-column"
            data-widget="treeview"
            role="menu"
            data-accordion="false"
          >
            <li className="nav-item">
              <Link to="/admin/adminpanel" className="nav-link active">
                <i className="nav-icon fas fa-tachometer-alt" />
                <p>Dashboard</p>
              </Link>
            </li>

            {/* User Management */}
            <li
              className="nav-header"
              onClick={() => toggleDropdown("userManagement")}
              style={{ cursor: "pointer" }}
            >
              USER MANAGEMENT
              <i
                className={`right fas fa-angle-${
                  openDropdown.userManagement ? "down" : "left"
                }`}
                style={{ float: "right" }}
              />
            </li>
            {openDropdown.userManagement && (
              <>
                <li className="nav-item">
                  <Link to="/Admin/users/approve" className="nav-link">
                    <i className="nav-icon fas fa-user-check" />
                    <p>Approve Users</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/Admin/users/roles" className="nav-link">
                    <i className="nav-icon fas fa-user-tag" />
                    <p>Role management</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/Admin/users/profiles" className="nav-link">
                    <i className="nav-icon fas fa-users" />
                    <p>User Profiles</p>
                  </Link>
                </li>
              </>
            )}

            {/* Vehicle Management */}
            <li
              className="nav-header"
              onClick={() => toggleDropdown("vehicleManagement")}
              style={{ cursor: "pointer" }}
            >
              FLEET MANAGEMENT
              <i
                className={`right fas fa-angle-${
                  openDropdown.vehicleManagement ? "down" : "left"
                }`}
                style={{ float: "right" }}
              />
            </li>
            {openDropdown.vehicleManagement && (
              <>
                <li className="nav-item">
                  <Link to="/Admin/fleet/statuses" className="nav-link">
                    <i className="nav-icon fas fa-car" />
                    <p>Vehicle Registrations</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/Admin/fleet" className="nav-link">
                    <i className="nav-icon fas fa-clipboard-check" />
                    <p>Manage fleet</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/Admin/fleet/assignments" className="nav-link">
                    <i className="nav-icon fas fa-user-tie" />
                    <p>Driver Management</p>
                  </Link>
                </li>
              </>
            )}

            {/* Financial Management */}
            <li
              className="nav-header"
              onClick={() => toggleDropdown("financialManagement")}
              style={{ cursor: "pointer" }}
            >
              FINANCIAL MANAGEMENT
              <i
                className={`right fas fa-angle-${
                  openDropdown.financialManagement ? "down" : "left"
                }`}
                style={{ float: "right" }}
              />
            </li>
            {openDropdown.financialManagement && (
              <>
                <li className="nav-item">
                  <Link to="/Admin/transactions" className="nav-link">
                    <i className="nav-icon fas fa-money-bill-wave" />
                    <p>Manage Financial Transactions</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/Admin/loans" className="nav-link">
                    <i className="nav-icon fas fa-hand-holding-usd" />
                    <p>Loans</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/Admin/savings" className="nav-link">
                    <i className="nav-icon fas fa-piggy-bank" />
                    <p>Savings</p>
                  </Link>
                </li>
              </>
            )}

            {/* Reports */}
            <li
              className="nav-header"
              onClick={() => toggleDropdown("reports")}
              style={{ cursor: "pointer" }}
            >
              REPORTS
              <i
                className={`right fas fa-angle-${
                  openDropdown.reports ? "down" : "left"
                }`}
                style={{ float: "right" }}
              />
            </li>
            {openDropdown.reports && (
              <>
                <li className="nav-item">
                  <Link
                    to="/Admin/reports/user-details"
                    className="nav-link"
                  >
                    <i className="nav-icon fas fa-file-alt" />
                    <p>Users</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/Admin/reports/vehicle-details"
                    className="nav-link"
                  >
                    <i className="nav-icon fas fa-file-alt" />
                    <p>Vehicles</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/Admin/reports/financial" className="nav-link">
                    <i className="nav-icon fas fa-file-alt" />
                    <p>Financials</p>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to="/Admin/reports/compliance"
                    className="nav-link"
                  >
                    <i className="nav-icon fas fa-file-alt" />
                    <p>Compliance Report</p>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
        {/* /.sidebar-menu */}
      </div>
      {/* /.sidebar */}
    </aside>
  );
}

export default Sidenav;