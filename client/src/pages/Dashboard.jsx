import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Clock, CheckCircle, Target, Sparkles, Zap } from 'lucide-react'
import AnalyticsCharts from '../components/AnalyticsCharts'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import './Dashboard.css'

const Dashboard = () => {
    const { user } = useAuth();
    const [dailyChallenge, setDailyChallenge] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [challengeRes, recRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/questions/daily'),
                    axios.get('http://localhost:5000/api/questions/recommendations')
                ]);
                setDailyChallenge(challengeRes.data);
                setRecommendations(recRes.data);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const stats = [
        { label: 'Total XP', value: user?.xp || '0', icon: <Trophy className="stat-icon yellow" /> },
        { label: 'Daily Streak', value: user?.dailyStreak || '0', icon: <Zap className="stat-icon purple" /> },
        { label: 'Accuracy', value: '82%', icon: <Target className="stat-icon green" /> },
        { label: 'Time Spent', value: '14h', icon: <Clock className="stat-icon blue" /> },
    ];

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content">
                <header className="dashboard-header">
                    <h1>Student <span className="gradient-text">Dashboard</span></h1>
                    <p>Welcome back, {user?.name || 'Explorer'}! Ready to level up today?</p>
                </header>

                <section className="stats-grid">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            className="stat-card glass-card"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            {stat.icon}
                            <div className="stat-info">
                                <span className="stat-label">{stat.label}</span>
                                <span className="stat-value">{stat.value}</span>
                            </div>
                        </motion.div>
                    ))}
                </section>

                <div className="dashboard-main-grid">
                    <div className="left-column">
                        <AnalyticsCharts />

                        <div className="recent-tests glass-card">
                            <h3>Recent Activity</h3>
                            <div className="test-list">
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="test-item">
                                        <div className="test-name">System Design Challenge #{i + 1}</div>
                                        <div className="test-meta">Score: 85% • 2 days ago</div>
                                        <button className="view-btn">View</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="right-column">
                        <div className="daily-challenge glass-card highlight">
                            <div className="card-badge">DAILY BOOST</div>
                            <h3>Daily Challenge</h3>
                            {dailyChallenge ? (
                                <div className="challenge-content">
                                    <h4>{dailyChallenge.title}</h4>
                                    <p>{dailyChallenge.category}</p>
                                    <div className={`difficulty-tag ${dailyChallenge.difficulty.toLowerCase()}`}>
                                        {dailyChallenge.difficulty}
                                    </div>
                                    <button className="primary-cta challenge-btn">Solve for 100 XP</button>
                                </div>
                            ) : (
                                <p className="loading-text">Loading today's challenge...</p>
                            )}
                        </div>

                        <div className="ai-recommendations glass-card">
                            <div className="rec-header">
                                <Sparkles size={18} className="sparkle-icon" />
                                <h3>AI Recommendations</h3>
                            </div>
                            <div className="rec-list">
                                {recommendations.length > 0 ? (
                                    recommendations.map((rec, i) => (
                                        <div key={i} className="rec-item">
                                            <div className="rec-info">
                                                <span className="rec-title">{rec.title}</span>
                                                <span className="rec-tag">{rec.category}</span>
                                            </div>
                                            <div className="rec-xp">+50 XP</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rec-placeholder">
                                        Complete more tests to unlock personalized paths!
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .dashboard-main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-top: 2rem; }
                .left-column, .right-column { display: flex; flex-direction: column; gap: 2rem; }
                
                .highlight { border: 1px solid var(--primary); background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(30, 30, 30, 0.5) 100%); }
                .card-badge { position: absolute; top: -10px; right: 20px; background: var(--primary); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.65rem; font-weight: 800; letter-spacing: 1px; }
                
                .difficulty-tag { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-top: 0.5rem; display: inline-block; padding: 2px 8px; border-radius: 4px; }
                .difficulty-tag.easy { color: #27c93f; background: rgba(39, 201, 63, 0.1); }
                .difficulty-tag.medium { color: #ffbd2e; background: rgba(255, 189, 46, 0.1); }
                .difficulty-tag.hard { color: #ff5f56; background: rgba(255, 95, 86, 0.1); }

                .rec-header { display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem; }
                .sparkle-icon { color: var(--primary); }
                .rec-list { display: flex; flex-direction: column; gap: 1rem; }
                .rec-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--glass); border-radius: 12px; border: 1px solid var(--glass-border); transition: 0.3s; cursor: pointer; }
                .rec-item:hover { border-color: var(--primary); transform: translateX(5px); }
                .rec-info { display: flex; flex-direction: column; gap: 4px; }
                .rec-title { font-size: 0.9rem; font-weight: 600; }
                .rec-tag { font-size: 0.75rem; color: var(--text-dim); }
                .rec-xp { font-weight: 800; color: var(--primary); font-size: 0.85rem; }
                .rec-placeholder { text-align: center; color: var(--text-dim); font-size: 0.85rem; padding: 2rem 0; }
                `
            }} />
        </div>
    )
}

export default Dashboard

