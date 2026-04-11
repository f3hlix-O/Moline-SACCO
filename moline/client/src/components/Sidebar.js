import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import matisLogo from "../assets/matis-logo.png";

function Sidebar() {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);

  const menuItems = [
    {
      type: "single",
      label: "Dashboard",
      icon: "fas fa-tachometer-alt",
      path: "/users/home",
    },
    {
      type: "dropdown",
      key: "vehicles",
      label: "Vehicles",
      icon: "fas fa-bus",
      children: [
        { label: "My Vehicles", path: "/users/vehicles" },
        { label: "Register Vehicle", path: "/users/addVehicle" },
      ],
    },
    {
      type: "dropdown",
      key: "financial",
      label: "Financial",
      icon: "fas fa-hand-holding-usd",
      children: [
        { label: "Payments", path: "/users/payments" },
        { label: "Apply for Loan", path: "/users/apply-loan" },
      ],
    },
    {
      type: "dropdown",
      key: "help",
      label: "Help",
      icon: "fas fa-question-circle",
      children: [
        { label: "How to Join the SACCO", path: "/users/help/join-sacco" },
        { label: "How to Apply for Loans", path: "/users/help/apply-loan" },
        { label: "How to Exit the SACCO", path: "/users/help/exit-sacco" },
      ],
    },
    {
      type: "single",
      label: "Exit Sacco",
      icon: "fas fa-sign-out-alt",
      path: "/users/exit",
    },
  ];

  const toggleDropdown = (sectionKey) => {
    setOpenDropdown((prev) => (prev === sectionKey ? null : sectionKey));
  };

  const filteredMenuItems = useMemo(() => {
    const q = (searchTerm || "").trim().toLowerCase();

    const seen = new Set();
    const deduped = [];

    for (const item of menuItems) {
      const sig =
        item.type === "dropdown"
          ? `dropdown:${item.key || item.label}`
          : `single:${item.path || item.label}`;

      if (seen.has(sig)) continue;
      seen.add(sig);
      deduped.push(item);
    }

    if (!q) return deduped;

    return deduped
      .map((item) => {
        if (item.type === "single") {
          return item.label.toLowerCase().includes(q) ? item : null;
        }

        if (item.type === "dropdown") {
          const parentMatches = item.label.toLowerCase().includes(q);
          const filteredChildren = (item.children || []).filter((child) =>
            child.label.toLowerCase().includes(q),
          );

          if (parentMatches) return item;
          if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          }

          return null;
        }

        return null;
      })
      .filter(Boolean);
  }, [searchTerm]);

  const isDropdownOpen = (item) => {
    return openDropdown === item.key;
  };

  const isActiveLink = (path) => location.pathname === path;

  return (
    <aside className="main-sidebar sidebar-dark-primary elevation-4">
      <Link to="/users/home" className="brand-link">
        <img
          src={matisLogo}
          alt="MaTIS Logo"
          className="brand-image img-circle elevation-3"
          style={{ opacity: 0.8 }}
        />
        <span className="brand-text font-weight-light">
          Moline Matatu SACCO
        </span>
      </Link>

      <div className="sidebar">
        <div className="form-inline mb-2 mt-3">
          <div className="input-group" data-widget="sidebar-search">
            <input
              className="form-control form-control-sidebar"
              type="search"
              placeholder="Search menu..."
              aria-label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="input-group-append">
              <button className="btn btn-sidebar" type="button">
                <i className="fas fa-search fa-fw" />
              </button>
            </div>
          </div>
        </div>

        <nav className="mt-2">
          <ul
            className="nav nav-pills nav-sidebar flex-column"
            data-widget="treeview"
            role="menu"
            data-accordion="false"
          >
            {filteredMenuItems.length > 0 ? (
              filteredMenuItems.map((item, index) => {
                if (item.type === "single") {
                  return (
                    <li className="nav-item" key={index}>
                      <Link
                        to={item.path}
                        className={`nav-link ${isActiveLink(item.path) ? "active" : ""}`}
                      >
                        <i className={`nav-icon ${item.icon}`} />
                        <p>{item.label}</p>
                      </Link>
                    </li>
                  );
                }

                return (
                  <li
                    className={`nav-item has-treeview ${isDropdownOpen(item) ? "menu-open" : ""}`}
                    key={item.key}
                  >
                    <button
                      type="button"
                      className="nav-link btn btn-link text-left w-100"
                      onClick={() => toggleDropdown(item.key)}
                      style={{
                        color: "#c2c7d0",
                        textDecoration: "none",
                        boxShadow: "none",
                      }}
                    >
                      <i className={`nav-icon ${item.icon}`} />
                      <p>
                        {item.label}
                        <i
                          className={`right fas fa-angle-${isDropdownOpen(item) ? "down" : "left"}`}
                        />
                      </p>
                    </button>

                    <ul
                      className="nav nav-treeview"
                      style={{
                        display: isDropdownOpen(item) ? "block" : "none",
                      }}
                    >
                      {item.children.map((child, childIndex) => (
                        <li className="nav-item" key={childIndex}>
                          <Link
                            to={child.path}
                            className={`nav-link ${isActiveLink(child.path) ? "active bg-dark" : "bg-dark"}`}
                          >
                            <i className="far fa-circle nav-icon" />
                            <p>{child.label}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })
            ) : (
              <li className="nav-item">
                <div className="nav-link text-muted">
                  <i className="nav-icon fas fa-search" />
                  <p>No menu item found</p>
                </div>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;