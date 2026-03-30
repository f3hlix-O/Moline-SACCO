import React, { useState } from "react";
import { Link } from "react-router-dom";
import matisLogo from "../assets/matis-logo.png";

function Sidebar() {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (section) => {
    setOpenDropdown((prev) => (prev === section ? null : section));
  };

  return (
    <div>
      <aside className="main-sidebar sidebar-dark-primary elevation-4">
        {/* Brand Logo */}
        <Link to="#" className="brand-link">
          <img
            src={matisLogo}
            alt="MaTIS Logo"
            className="brand-image img-circle elevation-3"
            style={{ opacity: ".8" }}
          />
          <span className="brand-text font-weight-light">Moline SACCO</span>
        </Link>

        {/* Sidebar */}
        <div className="sidebar">
          {/* User Panel */}
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
                User Name
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="form-inline">
            <div className="input-group" data-widget="sidebar-search">
              <input
                className="form-control form-control-sidebar"
                type="search"
                placeholder="Search"
                aria-label="Search"
              />
              <div className="input-group-append">
                <button className="btn btn-sidebar">
                  <i className="fas fa-search fa-fw" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Menu */}
          <nav className="mt-2">
            <ul
              className="nav nav-pills nav-sidebar flex-column"
              data-widget="treeview"
              role="menu"
              data-accordion="false"
            >
              {/* Dashboard */}
              <li className="nav-item">
                <Link to="/users/home" className="nav-link">
                  <i className="nav-icon fas fa-tachometer-alt" />
                  <p>Dashboard</p>
                </Link>
              </li>

              {/* Vehicles */}
              <li className="nav-item has-treeview">
                <Link
                  to="#"
                  className="nav-link"
                  onClick={() => toggleDropdown("vehicles")}
                >
                  <i className="nav-icon fas fa-bus" />
                  <p>
                    Vehicles
                    <i
                      className={`right fas fa-angle-${openDropdown === "vehicles" ? "down" : "left"}`}
                    />
                  </p>
                </Link>
                <ul
                  className={`nav nav-treeview ${openDropdown === "vehicles" ? "menu-open" : ""}`}
                  style={{
                    display: openDropdown === "vehicles" ? "block" : "none",
                  }}
                >
                  <li className="nav-item">
                    <Link to="/users/vehicles" className="nav-link bg-dark">
                      <i className="far fa-circle nav-icon" />
                      <p>My Vehicles</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/users/addVehicle" className="nav-link bg-dark">
                      <i className="far fa-circle nav-icon" />
                      <p>Register Vehicle</p>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Financial */}
              <li className="nav-item has-treeview">
                <Link
                  to="#"
                  className="nav-link"
                  onClick={() => toggleDropdown("financial")}
                >
                  <i className="nav-icon fas fa-hand-holding-usd" />
                  <p>
                    Financial
                    <i
                      className={`right fas fa-angle-${openDropdown === "financial" ? "down" : "left"}`}
                    />
                  </p>
                </Link>
                <ul
                  className={`nav nav-treeview ${openDropdown === "financial" ? "menu-open" : ""}`}
                  style={{
                    display: openDropdown === "financial" ? "block" : "none",
                  }}
                >
                  <li className="nav-item">
                    <Link to="/users/payments" className="nav-link bg-dark">
                      <i className="far fa-circle nav-icon" />
                      <p>Payments</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/users/apply-loan" className="nav-link bg-dark">
                      <i className="far fa-circle nav-icon" />
                      <p>Apply for Loan</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/users/financial-status"
                      className="nav-link bg-dark"
                    >
                      <i className="far fa-circle nav-icon" />
                      <p>Financial Status</p>
                    </Link>
                  </li>
                  {/* <li className="nav-item">
                    <Link to="/users/loan-history" className="nav-link bg-dark">
                      <i className="far fa-circle nav-icon" />
                      <p>Loan History</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link to="/users/savings-history" className="nav-link bg-dark">
                      <i className="far fa-circle nav-icon" />
                      <p>Savings History</p>
                    </Link>
                  </li> */}
                </ul>
              </li>

              {/* Exit SACCO */}
              <li className="nav-item">
                <Link to="/users/exit" className="nav-link">
                  <i className="nav-icon fas fa-sign-out-alt" />
                  <p>Exit Sacco</p>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
    </div>
  );
}

export default Sidebar;
