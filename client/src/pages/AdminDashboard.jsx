import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, FilePlus, Database, BarChart3, Plus,
    Settings, Shield, Trash2, Edit3, Save, X,
    CheckCircle, MessageSquare, AlertTriangle
} from 'lucide-react';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('stats');
    const [showModal, setShowModal] = useState(false);

    const adminStats = [
        { label: 'Total Students', value: '1,240', change: '+12%', icon: <Users className="stat-icon purple" /> },
        { label: 'Active Tests', value: '45', change: '+3', icon: <Database className="stat-icon blue" /> },
        { label: 'Submissions', value: '8,421', change: '+412', icon: <CheckCircle className="stat-icon green" /> },
        { label: 'Avg. Score', value: '72%', change: '-2%', icon: <BarChart3 className="stat-icon yellow" /> },
    ];

    const questions = [
        { id: 1, title: 'Find Missing Number', category: 'DSA', difficulty: 'Easy', status: 'Published' },
        { id: 2, title: 'Optimizing SQL Joins', category: 'DBMS', difficulty: 'Hard', status: 'Draft' },
        { id: 3, title: 'B-Tree Implementation', category: 'DSA', difficulty: 'Medium', status: 'Published' },
    ];

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content">
                <header className="dashboard-header admin-flex">
                    <div>
                        <h1>System <span className="gradient-text">Command</span></h1>
                        <p>Central control for content, users, and platform intelligence.</p>
                    </div>
                    <div className="admin-actions">
                        <button className="secondary-cta"><Settings size={18} /> Settings</button>
                        <button className="primary-cta" onClick={() => setShowModal(true)}>
                            <Plus size={20} /> New Content
                        </button>
                    </div>
                </header>

                <nav className="admin-tabs">
                    <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>Overview</button>
                    <button className={activeTab === 'content' ? 'active' : ''} onClick={() => setActiveTab('content')}>Question Bank</button>
                    <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Students</button>
                </nav>

                <AnimatePresence mode="wait">
                    {activeTab === 'stats' && (
                        <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <section className="stats-grid">
                                {adminStats.map((stat, i) => (
                                    <div key={i} className="stat-card glass-card">
                                        <div className="stat-header">
                                            {stat.icon}
                                            <span className={`stat-change ${stat.change.startsWith('+') ? 'up' : 'down'}`}>
                                                {stat.change}
                                            </span>
                                        </div>
                                        <div className="stat-info">
                                            <span className="stat-label">{stat.label}</span>
                                            <span className="stat-value">{stat.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </section>

                            <div className="admin-grid-layout">
                                <div className="glass-card table-section">
                                    <h3>Recent Reports</h3>
                                    <div className="report-list">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="report-item">
                                                <div className="badge warn">Critical</div>
                                                <p>API Latency spike detected in /api/v1/compiler</p>
                                                <span>14m ago</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="glass-card activity-section">
                                    <h3>System Health</h3>
                                    <div className="health-metrics">
                                        <div className="h-node"><span>CPU</span><div className="h-bar"><div className="h-fill" style={{ width: '25%' }}></div></div></div>
                                        <div className="h-node"><span>RAM</span><div className="h-bar"><div className="h-fill" style={{ width: '68%' }}></div></div></div>
                                        <div className="h-node"><span>DISK</span><div className="h-bar"><div className="h-fill" style={{ width: '42%' }}></div></div></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'content' && (
                        <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="glass-card question-manager">
                                <div className="table-header">
                                    <h3>Central Question Pool</h3>
                                    <div className="search-mini">
                                        <Plus size={14} /> Search
                                    </div>
                                </div>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Category</th>
                                            <th>Difficulty</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {questions.map(q => (
                                            <tr key={q.id}>
                                                <td>{q.title}</td>
                                                <td><span className="cat-tag">{q.category}</span></td>
                                                <td><span className={`diff-tag ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span></td>
                                                <td><span className={`status-tag ${q.status.toLowerCase()}`}>{q.status}</span></td>
                                                <td className="actions-cell">
                                                    <button className="a-btn"><Edit3 size={16} /></button>
                                                    <button className="a-btn del"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Question Creation Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <motion.div className="admin-modal glass-card" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                            <div className="modal-header">
                                <h3>Create New Mock Problem</h3>
                                <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Problem Title</label>
                                    <input type="text" placeholder="e.g. Reverse a Linked List" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select><option>DSA</option><option>OS</option><option>DBMS</option></select>
                                    </div>
                                    <div className="form-group">
                                        <label>Difficulty Level</label>
                                        <select><option>Easy</option><option>Medium</option><option>Hard</option></select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Problem Description (Markdown supported)</label>
                                    <textarea rows="4" placeholder="Enter problem statement..."></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="secondary-cta" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="primary-cta"><Save size={18} /> Save to Drafts</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .admin-flex { display: flex; justify-content: space-between; align-items: center; }
                .admin-actions { display: flex; gap: 1rem; }
                
                .admin-tabs { display: flex; gap: 2rem; border-bottom: 1px solid var(--glass-border); margin: 2rem 0; padding-bottom: 0.5rem; }
                .admin-tabs button { background: none; border: none; color: var(--text-dim); font-size: 1rem; font-weight: 600; cursor: pointer; position: relative; padding: 0.5rem 0; }
                .admin-tabs button.active { color: var(--primary); }
                .admin-tabs button.active::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background: var(--primary); }

                .stat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .stat-change { font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
                .stat-change.up { background: rgba(39, 201, 63, 0.1); color: #27c93f; }
                .stat-change.down { background: rgba(255, 95, 86, 0.1); color: #ff5f56; }

                .admin-grid-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-top: 2rem; }
                .table-section, .activity-section { padding: 2rem; }
                .report-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; }
                .report-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--glass); border-radius: 10px; border: 1px solid var(--glass-border); }
                .report-item p { flex: 1; font-size: 0.85rem; }
                .report-item span { font-size: 0.75rem; color: var(--text-dim); }
                .badge { padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
                .badge.warn { background: #ffbd2e; color: black; }

                .h-node { margin-bottom: 1.5rem; }
                .h-node span { font-size: 0.8rem; color: var(--text-dim); display: block; margin-bottom: 8px; }
                .h-bar { height: 6px; background: var(--glass); border-radius: 3px; overflow: hidden; }
                .h-fill { height: 100%; background: var(--primary); border-radius: 3px; }

                .question-manager { padding: 2rem; margin-top: 2rem; }
                .table-header { display: flex; justify-content: space-between; margin-bottom: 2rem; }
                .admin-table { width: 100%; border-collapse: collapse; }
                .admin-table th { text-align: left; color: var(--text-dim); font-size: 0.85rem; padding-bottom: 1rem; border-bottom: 1px solid var(--glass-border); }
                .admin-table td { padding: 1.2rem 0; border-bottom: 1px solid var(--glass-border); font-size: 0.9rem; }
                .cat-tag { padding: 2px 8px; background: rgba(157, 78, 221, 0.1); color: var(--primary); border-radius: 4px; font-size: 0.75rem; }
                .diff-tag { font-size: 0.8rem; font-weight: 600; }
                .diff-tag.easy { color: #27c93f; }
                .diff-tag.medium { color: #ffbd2e; }
                .diff-tag.hard { color: #ff5f56; }
                .status-tag { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; border: 1px solid white; }
                .status-tag.published { border-color: #27c93f; color: #27c93f; }
                .status-tag.draft { border-color: var(--text-dim); color: var(--text-dim); }
                .actions-cell { display: flex; gap: 0.5rem; }
                .a-btn { background: var(--glass); border: 1px solid var(--glass-border); color: white; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
                .a-btn.del:hover { background: #ff5f56; }

                /* Modal Styles */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
                .admin-modal { width: 100%; max-width: 600px; padding: 2.5rem; position: relative; }
                .modal-header { display: flex; justify-content: space-between; margin-bottom: 2rem; }
                .form-group { display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1.5rem; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .form-group label { font-size: 0.9rem; font-weight: 600; color: var(--text-dim); }
                .form-group input, .form-group select, .form-group textarea { background: var(--glass); border: 1px solid var(--glass-border); color: white; padding: 0.8rem 1rem; border-radius: 10px; outline: none; }
                .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
                .close-btn { background: none; border: none; color: var(--text-dim); cursor: pointer; }
            `}} />
        </div>
    );
};

export default AdminDashboard;
