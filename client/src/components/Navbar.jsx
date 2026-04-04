import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Menu, X } from 'lucide-react';
import './Navbar.css';

const NAV_LINKS = [
    { label: 'Features', href: '#features' },
    { label: 'Companies', href: '/company-prep' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Forum', href: '/forum' },
];

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => setMenuOpen(false), [location]);

    return (
        <nav className={`navbar glass-card ${scrolled ? 'scrolled' : ''}`}>
            {/* Logo */}
            <Link to="/" className="logo-text" style={{ textDecoration: 'none' }}>
                <span className="logo-icon"><Zap size={22} /></span>
                Career<span>Quest</span>
            </Link>

            {/* Desktop nav links */}
            <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
                {NAV_LINKS.map(({ label, href }) =>
                    href.startsWith('/') ? (
                        <Link
                            key={label}
                            to={href}
                            className={location.pathname === href ? 'active' : ''}
                        >
                            {label}
                        </Link>
                    ) : (
                        <a key={label} href={href}>{label}</a>
                    )
                )}
            </div>

            {/* Actions */}
            <div className="nav-actions">
                <Link to="/login" className="login-btn">Log In</Link>
                <Link to="/register" className="signup-btn">Get Started</Link>

                {/* Hamburger (mobile) */}
                <button
                    className="hamburger"
                    onClick={() => setMenuOpen(prev => !prev)}
                    aria-label="Toggle menu"
                >
                    {menuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
