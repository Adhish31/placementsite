import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    LayoutDashboard, FileText, BookMarked, Trophy,
    Briefcase, Settings, LogOut, Code, FileSearch,
    MessageSquare, Zap, Mic
} from 'lucide-react'
import './Sidebar.css'

const Sidebar = () => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const menuItems = [
        { title: 'Dashboard', icon: <LayoutDashboard size={19} />, path: '/dashboard' },
        { title: 'AI Interview', icon: <Mic size={19} />, path: '/mock-interview' }, // New
        { title: 'Resume AI', icon: <FileSearch size={19} />, path: '/resume-analyzer' },
        { title: 'Mock Tests', icon: <FileText size={19} />, path: '/results' },
        { title: 'Compiler', icon: <Code size={19} />, path: '/compiler' },
        { title: 'Leaderboard', icon: <Trophy size={19} />, path: '/leaderboard' },
        { title: 'Forum', icon: <MessageSquare size={19} />, path: '/forum' },
        { title: 'Company Prep', icon: <Briefcase size={19} />, path: '/company-prep' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <aside className="sidebar glass-card">
            <div className="sidebar-logo">
                <Zap size={18} className="sidebar-logo-icon" />
                <span className="logo-text">Career<span>Quest</span></span>
            </div>

            {user && (
                <div className="sidebar-user">
                    <div className="sidebar-avatar">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{user.name}</span>
                        <span className="sidebar-user-xp">
                            <Zap size={11} /> {user.xp || 0} XP
                        </span>
                    </div>
                </div>
            )}

            <nav className="sidebar-nav">
                <div className="nav-group-label">Menu</div>
                {menuItems.map((item, index) => (
                    <Link
                        key={index}
                        to={item.path}
                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        title={item.title}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.title}</span>
                        {location.pathname === item.path && (
                            <span className="nav-active-dot" />
                        )}
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <Link to="/settings" className="nav-item" title="Settings">
                    <span className="nav-icon"><Settings size={19} /></span>
                    <span className="nav-label">Settings</span>
                </Link>
                <button className="nav-item logout-btn" onClick={handleLogout} title="Logout">
                    <span className="nav-icon"><LogOut size={19} /></span>
                    <span className="nav-label">Logout</span>
                </button>
            </div>
        </aside>
    )
}

export default Sidebar
