import React from "react";
import { NavLink } from "react-router-dom";

const Icon = ({ name }) => {
  // Simple inline SVG icons for the menu
  switch (name) {
    case "dashboard":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 13h8V3H3v10zM3 21h8v-6H3v6zM13 21h8V11h-8v10zM13 3v6h8V3h-8z"
            fill="currentColor"
          />
        </svg>
      );
    case "users":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.96 1.97 3.45V19h6v-2.5C23 14.17 18.33 13 16 13z"
            fill="currentColor"
          />
        </svg>
      );
    case "vehicles":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 11V8a1 1 0 0 1 1-1h1l1-3h10l1 3h1a1 1 0 0 1 1 1v3"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
          />
          <circle cx="7.5" cy="17.5" r="1.5" fill="currentColor" />
          <circle cx="17.5" cy="17.5" r="1.5" fill="currentColor" />
        </svg>
      );
    case "loans":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 1v22M17 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
          />
        </svg>
      );
    case "reports":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 3h18v18H3V3zm4 4h10v2H7V7zM7 11h6v2H7v-2zM7 15h4v2H7v-2z"
            fill="currentColor"
          />
        </svg>
      );
    default:
      return null;
  }
};

const Sidebar = () => {
  const items = [
    { to: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
    { to: "/admin/users", label: "Users", icon: "users" },
    { to: "/admin/fleet", label: "Vehicles", icon: "vehicles" },
    { to: "/admin/loans", label: "Loans", icon: "loans" },
    { to: "/admin/reports", label: "Reports", icon: "reports" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">MS</div>
        <div className="brand-text">Moline</div>
      </div>

      <nav className="sidebar-nav">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? "active" : ""}`
            }
          >
            <span className="item-icon">
              <Icon name={it.icon} />
            </span>
            <span className="item-label">{it.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">Moline SACCO</div>
    </aside>
  );
};

export default Sidebar;
