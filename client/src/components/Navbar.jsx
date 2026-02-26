import React from 'react';
import './Navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar glass-card">
            <div className="nav-logo">
                <span className="logo-text">Career<span>Quest</span></span>
            </div>
            <ul className="nav-links">
                <li><a href="#dashboard">Dashboard</a></li>
                <li><a href="#tests">Mock Tests</a></li>
                <li><a href="#materials">Materials</a></li>
                <li><a href="#profile">Profile</a></li>
            </ul>
            <div className="nav-actions">
                <button className="login-btn">Login</button>
                <button className="signup-btn">Get Started</button>
            </div>
        </nav>
    );
};

export default Navbar;
