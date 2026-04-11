import React, { useState } from "react";
// import './Navbar.css';
// Sidebar is rendered by the layout; Navbar should not render Sidebar directly to avoid duplicates
import ProfilePage from "./ProfilePage";
import { Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

function Navbar({ notifications = [], userProfile = {} }) {
  // Sidebar visibility is controlled via body class toggle to match AdminLTE behavior
  const [profileVisible, setProfileVisible] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const toggleSidebar = (e) => {
    e && e.preventDefault();
    // Toggle AdminLTE-compatible collapse class on body so the sidebar can open/close
    document.body.classList.toggle("sidebar-collapse");
    return false;
  };

  // Function to toggle profile visibility
  const toggleProfile = () => {
    setProfileVisible(!profileVisible);
  };

  // Function to handle logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <nav className="main-header navbar navbar-expand navbar-dark">
        {/* Left navbar links */}
        <ul className="navbar-nav">
          <li className="nav-item">
            <a
              className="nav-link"
              onClick={toggleSidebar}
              href="#"
              role="button"
            >
              <i className="fas fa-bars" />
            </a>
          </li>
        </ul>
        {/* Right navbar links */}
        <ul className="navbar-nav ml-auto">
          <li className="nav-item">
            <a
              className="nav-link"
              data-widget="fullscreen"
              href="#"
              role="button"
            >
              <i className="fas fa-expand-arrows-alt" />
            </a>
          </li>
          <li className="nav-item">
            <a
              className="nav-link"
              data-widget="control-sidebar"
              data-slide="true"
              href="#"
              role="button"
            >
              <i className="fas fa-th-large" />
            </a>
          </li>
          {/* User Profile Dropdown */}
          <li className="nav-item dropdown">
            <a
              className="nav-link dropdown-toggle"
              href="#"
              role="button"
              onClick={toggleProfile}
            >
              <i className="far fa-user-circle"></i>
            </a>
          </li>
          {/* Logout Button */}
          <li className="nav-item">
            <a className="nav-link" href="#" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
            </a>
          </li>
        </ul>
      </nav>

      {/* Sidebar is rendered by the layout (Routes/UserLayout) to avoid duplicate sidebars */}

      {/* Profile Page Modal */}
      <Modal show={profileVisible} onHide={toggleProfile} size="lg">
        {/* Set size="lg" for large size */}
        <Modal.Header closeButton>
          <Modal.Title>User Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProfilePage
            userProfile={userProfile}
            toggleProfile={toggleProfile}
          />
        </Modal.Body>
      </Modal>
    </>
  );
}

export default Navbar;
