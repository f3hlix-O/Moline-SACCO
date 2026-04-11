import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Sidenav.css";
import matisLogo from "../../assets/matis-logo.png";

function SidebarSearch({ placeholder = "Search menu...", value, onChange }) {
  return (
    <div className="form-inline">
      <div className="input-group">
        <input
          className="form-control form-control-sidebar"
          type="search"
          placeholder={placeholder}
          aria-label={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="input-group-append">
          <button className="btn btn-sidebar" type="button">
            <i className="fas fa-search fa-fw" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Sidenav() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState({
    userManagement: false,
    vehicleManagement: false,
    financialManagement: false,
    reports: false,
  });

  const menuSections = [
    {
      key: "userManagement",
      title: "USER MANAGEMENT",
      items: [
        {
          label: "Approve Users",
          to: "/admin/users/approve",
          icon: "fas fa-user-check",
        },
        {
          label: "Role management",
          to: "/admin/users/roles",
          icon: "fas fa-user-tag",
        },
        {
          label: "User Profiles",
          to: "/admin/users/profiles",
          icon: "fas fa-users",
        },
        {
          label: "Withdrawal Submissions",
          to: "/admin/users",
          icon: "fas fa-file-invoice",
        },
      ],
    },
    {
      key: "vehicleManagement",
      title: "FLEET MANAGEMENT",
      items: [
        {
          label: "Vehicle Registrations",
          to: "/admin/fleet/statuses",
          icon: "fas fa-car",
        },
        {
          label: "Manage fleet",
          to: "/admin/fleet",
          icon: "fas fa-clipboard-check",
        },
        {
          label: "Driver Management",
          to: "/admin/fleet/assignments",
          icon: "fas fa-user-tie",
        },
      ],
    },
    {
      key: "financialManagement",
      title: "FINANCIAL MANAGEMENT",
      items: [
        {
          label: "Loans",
          to: "/admin/loans",
          icon: "fas fa-hand-holding-usd",
        },
        {
          label: "Savings",
          to: "/admin/savings",
          icon: "fas fa-piggy-bank",
        },
      ],
    },
    {
      key: "reports",
      title: "REPORTS",
      items: [
        {
          label: "Users",
          to: "/admin/reports/user-details",
          icon: "fas fa-file-alt",
        },
        {
          label: "Vehicles",
          to: "/admin/reports/vehicle-details",
          icon: "fas fa-file-alt",
        },
        {
          label: "Financials",
          to: "/admin/reports/financial",
          icon: "fas fa-file-alt",
        },
        {
          label: "Compliance Report",
          to: "/admin/reports/compliance",
          icon: "fas fa-file-alt",
        },
      ],
    },
  ];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const filteredSections = useMemo(() => {
    if (!normalizedQuery) return menuSections;

    return menuSections
      .map((section) => {
        const sectionMatches = section.title
          .toLowerCase()
          .includes(normalizedQuery);

        const filteredItems = sectionMatches
          ? section.items
          : section.items.filter((item) =>
              item.label.toLowerCase().includes(normalizedQuery),
            );

        return {
          ...section,
          items: filteredItems,
        };
      })
      .filter((section) => section.items.length > 0);
  }, [normalizedQuery]);

  const dashboardVisible =
    !normalizedQuery || "dashboard".includes(normalizedQuery);

  const toggleDropdown = (sectionKey) => {
    if (isSearching) return;

    setOpenDropdown((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  return (
    <aside className="main-sidebar sidebar-dark-primary elevation-4 custom-sidenav">
      <Link to="#" className="brand-link">
        <img
          src={matisLogo}
          alt="Moline Logo"
          className="brand-image img-circle elevation-3"
          style={{ opacity: ".8" }}
        />
        <span className="brand-text font-weight-light">Moline system</span>
      </Link>

      <div className="sidebar">
        <div className="user-panel mt-3 pb-3 mb-3 d-flex align-items-center">
          <div className="info">
            <Link to="#" className="d-block">
              Super Admin (MANAGER)
            </Link>
          </div>
        </div>

        <SidebarSearch
          placeholder="Search menu..."
          value={searchQuery}
          onChange={setSearchQuery}
        />

        <nav className="mt-2">
          <ul
            className="nav nav-pills nav-sidebar flex-column"
            role="menu"
            data-accordion="false"
          >
            {dashboardVisible && (
              <li className="nav-item">
                <Link to="/admin/adminpanel" className="nav-link active">
                  <i className="nav-icon fas fa-tachometer-alt" />
                  <p>Dashboard</p>
                </Link>
              </li>
            )}

            {filteredSections.map((section) => {
              const shouldOpen = isSearching ? true : openDropdown[section.key];

              return (
                <React.Fragment key={section.key}>
                  <li
                    className="nav-header"
                    onClick={() => toggleDropdown(section.key)}
                    style={{ cursor: isSearching ? "default" : "pointer" }}
                  >
                    {section.title}
                    <i
                      className={`right fas fa-angle-${shouldOpen ? "down" : "left"}`}
                      style={{ float: "right" }}
                    />
                  </li>

                  {shouldOpen &&
                    section.items.map((item) => (
                      <li className="nav-item" key={item.to}>
                        <Link to={item.to} className="nav-link">
                          <i className={`nav-icon ${item.icon}`} />
                          <p>{item.label}</p>
                        </Link>
                      </li>
                    ))}
                </React.Fragment>
              );
            })}

            {isSearching &&
              !dashboardVisible &&
              filteredSections.length === 0 && (
                <li className="nav-item">
                  <div className="nav-link text-muted">
                    <i className="nav-icon fas fa-search" />
                    <p>No matching menu found</p>
                  </div>
                </li>
              )}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

export default Sidenav;
