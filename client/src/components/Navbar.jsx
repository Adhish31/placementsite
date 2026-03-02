import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar glass-card">
            <div className="nav-logo">
                <Link to="/" className="logo-text">Career<span>Quest</span></Link>
            </div>
            <ul className="nav-links">
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/results">Mock Tests</Link></li>
                <li><Link to="/company-prep">Materials</Link></li>
                <li><Link to="/dashboard">Profile</Link></li>
            </ul>
            <div className="nav-actions">
                <Link to="/login" className="login-btn">Login</Link>
                <Link to="/register" className="signup-btn">Get Started</Link>
            </div>
        </nav>
    );
};

export default Navbar;
