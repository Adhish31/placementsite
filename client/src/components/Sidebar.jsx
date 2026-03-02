import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
    LayoutDashboard, FileText, BookMarked, Trophy,
    Briefcase, Settings, LogOut, Code, FileSearch,
    MessageSquare, ListTodo
} from 'lucide-react'
import './Sidebar.css'

const Sidebar = () => {
    const location = useLocation();

    const menuItems = [
        { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { title: 'Mock Tests', icon: <FileText size={20} />, path: '/tests' },
        { title: 'Compiler', icon: <Code size={20} />, path: '/compiler' },
        { title: 'Leaderboard', icon: <ListTodo size={20} />, path: '/leaderboard' },
        { title: 'Resume AI', icon: <FileSearch size={20} />, path: '/resume-analyzer' },
        { title: 'Forum', icon: <MessageSquare size={20} />, path: '/forum' },
        { title: 'Company Prep', icon: <Briefcase size={20} />, path: '/company-prep' },
        { title: 'Results', icon: <Trophy size={20} />, path: '/results' },
    ];

    return (
        <aside className="sidebar glass-card">
            <div className="sidebar-logo">
                <span className="logo-text">C<span>Q</span></span>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item, index) => (
                    <Link
                        key={index}
                        to={item.path}
                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        {item.icon}
                        <span className="nav-label">{item.title}</span>
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <Link to="/settings" className="nav-item">
                    <Settings size={20} />
                    <span className="nav-label">Settings</span>
                </Link>
                <button className="nav-item logout-btn">
                    <LogOut size={20} />
                    <span className="nav-label">Logout</span>
                </button>
            </div>
        </aside>
    )
}

export default Sidebar
