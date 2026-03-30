import React from 'react';
import { Link } from 'react-router-dom';
import saccoLogo from '../assets/vuka-logo-removebg.png';

const Navbar = () => {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
            <div className="container">
                {/* Logo */}
                <Link className="navbar-brand" to="/">
                    <img src={saccoLogo} alt="Vuka SACCO Logo" style={{ width: '120px' }} />
                </Link>

                {/* Toggle Button for Mobile */}
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Navbar Links */}
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <Link className="nav-link" to="/">Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/about">About Us</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/join-us">Join Us</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/faq">FAQ</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/contact">Contact Us</Link>
                        </li>
                        {/* Login/Register Buttons */}
                        <li className="nav-item ms-3">
                            <Link className="btn btn-primary" to="/login">Login</Link>
                        </li>
                        <li className="nav-item ms-2">
                            <Link className="btn btn-success" to="/register">Sign Up</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
