import React, { useState } from 'react';
// import './Navbar.css'; 
import Sidebar from './Sidebar';
import ProfilePage from './ProfilePage'; 
import { Modal, Button } from 'react-bootstrap'; 
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthProvider'; 

function Navbar({ notifications = [], userProfile = {} }) {
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [profileVisible, setProfileVisible] = useState(false); 
    const navigate = useNavigate(); 
    const { logout } = useAuth(); 

    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
        if (!sidebarVisible) {
            document.body.classList.add('control-sidebar-push');
        } else {
            document.body.classList.remove('control-sidebar-push');
        }
    };

    // Function to toggle profile visibility
    const toggleProfile = () => {
        setProfileVisible(!profileVisible);
    };

    // Function to handle logout
    const handleLogout = () => {
        logout(); 
        navigate('/login'); 
    };

    return (
        <>
            <nav className="main-header navbar navbar-expand navbar-dark">
                {/* Left navbar links */}
                <ul className="navbar-nav">
                    <li className="nav-item">
                        <a className="nav-link" onClick={toggleSidebar} href="#" role="button">
                            <i className="fas fa-bars" />
                        </a>
                    </li>
                </ul>
                {/* Right navbar links */}
                <ul className="navbar-nav ml-auto">
                    {/* Notifications Dropdown Menu */}
                    <li className="nav-item dropdown">
                        <a className="nav-link" data-toggle="dropdown" href="#">
                            <i className="far fa-bell" />
                            <span className="badge badge-warning navbar-badge">15</span>
                        </a>
                        <div className="dropdown-menu dropdown-menu-lg dropdown-menu-right">
                            <span className="dropdown-item dropdown-header">15 Notifications</span>
                            <div className="dropdown-divider" />
                            <a href="#" className="dropdown-item">
                                <i className="fas fa-envelope mr-2" /> 4 new messages
                                <span className="float-right text-muted text-sm">3 mins</span>
                            </a>
                            <div className="dropdown-divider" />
                            <a href="#" className="dropdown-item">
                                <i className="fas fa-users mr-2" /> 8 friend requests
                                <span className="float-right text-muted text-sm">12 hours</span>
                            </a>
                            <div className="dropdown-divider" />
                            <a href="#" className="dropdown-item">
                                <i className="fas fa-file mr-2" /> 3 new reports
                                <span className="float-right text-muted text-sm">2 days</span>
                            </a>
                            <div className="dropdown-divider" />
                            <a href="#" className="dropdown-item dropdown-footer">
                                See All Notifications
                            </a>
                        </div>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" data-widget="fullscreen" href="#" role="button">
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
                        <a className="nav-link dropdown-toggle" href="#" role="button" onClick={toggleProfile}>
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

            {/* Sidebar Component */}
            <Sidebar isOpen={sidebarVisible} toggleSidebar={toggleSidebar} />

            {/* Profile Page Modal */}
            <Modal show={profileVisible} onHide={toggleProfile} size="lg">
                {/* Set size="lg" for large size */}
                <Modal.Header closeButton>
                    <Modal.Title>User Profile</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ProfilePage userProfile={userProfile} toggleProfile={toggleProfile} />
                </Modal.Body>
            </Modal>
        </>
    );
}

export default Navbar;
