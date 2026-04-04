import React, { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Clock, CheckCircle, Target, Sparkles, Zap, ArrowRight } from 'lucide-react'
import AnalyticsCharts from '../components/AnalyticsCharts'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './Dashboard.css'

const Dashboard = () => {
    const { user } = useAuth();
    const [dailyChallenge, setDailyChallenge] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studyTaskInput, setStudyTaskInput] = useState('');
    const [studyTasks, setStudyTasks] = useState([]);
    const [quickNavQuery, setQuickNavQuery] = useState('');

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

    const plannerStorageKey = useMemo(() => `study-planner:${user?._id || user?.email || 'guest'}`, [user?._id, user?.email]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(plannerStorageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) setStudyTasks(parsed);
            }
        } catch (error) {
            console.error('Failed to load study planner tasks:', error);
        }
    }, [plannerStorageKey]);

    useEffect(() => {
        try {
            localStorage.setItem(plannerStorageKey, JSON.stringify(studyTasks));
        } catch (error) {
            console.error('Failed to save study planner tasks:', error);
        }
    }, [plannerStorageKey, studyTasks]);

    const addStudyTask = (event) => {
        event.preventDefault();
        const title = studyTaskInput.trim();
        if (!title) return;
        setStudyTasks((prev) => [{ id: Date.now(), title, done: false }, ...prev].slice(0, 8));
        setStudyTaskInput('');
    };

    const toggleStudyTask = (id) => {
        setStudyTasks((prev) => prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
    };

    const removeStudyTask = (id) => {
        setStudyTasks((prev) => prev.filter((task) => task.id !== id));
    };

    const completedStudyTasks = studyTasks.filter((task) => task.done).length;
    const quickLinks = [
        { label: 'Start Daily Test', to: '/test/daily', hint: 'Practice' },
        { label: 'View Results', to: '/results', hint: 'Progress' },
        { label: 'Company Prep', to: '/company-prep', hint: 'Interview prep' },
        { label: 'Leaderboard', to: '/leaderboard', hint: 'Compete' },
        { label: 'Compiler', to: '/compiler', hint: 'Code now' },
        { label: 'Resume Analyzer', to: '/resume-analyzer', hint: 'Resume tips' },
        { label: 'Community Forum', to: '/forum', hint: 'Discuss' },
    ];
    const filteredQuickLinks = quickLinks.filter((link) =>
        `${link.label} ${link.hint}`.toLowerCase().includes(quickNavQuery.trim().toLowerCase())
    );

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const stats = [
        { label: 'Total XP', value: user?.xp || '0', icon: <Trophy className="stat-icon yellow" />, suffix: 'pts' },
        { label: 'Day Streak', value: user?.dailyStreak || '0', icon: <Zap className="stat-icon purple" />, suffix: '🔥' },
        { label: 'Accuracy', value: '82', icon: <Target className="stat-icon green" />, suffix: '%' },
        { label: 'Time Spent', value: '14', icon: <Clock className="stat-icon blue" />, suffix: 'h' },
    ];

    return (
        <>
            <header className="dashboard-header">
                <div>
                    <h1>{greeting()}, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Explorer'}</span> 👋</h1>
                    <p>Ready to level up today? You're on a {user?.dailyStreak || 0}-day streak. Keep it going!</p>
                </div>
                <Link to="/test/daily" className="primary-cta start-test-cta">
                    Start Test <ArrowRight size={16} />
                </Link>
            </header>

            <section className="stats-grid">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        className="stat-card glass-card"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08 }}
                    >
                        {stat.icon}
                        <div className="stat-info">
                            <span className="stat-label">{stat.label}</span>
                            <span className="stat-value">{stat.value}<span className="stat-suffix">{stat.suffix}</span></span>
                        </div>
                    </motion.div>
                ))}
            </section>

            <div className="dashboard-main-grid">
                <div className="left-column">
                    <AnalyticsCharts />

                    <div className="quick-nav glass-card">
                        <div className="quick-nav-header">
                            <h3>Quick Navigation</h3>
                            <span>Jump to any module</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Search pages like compiler, results, forum..."
                            value={quickNavQuery}
                            onChange={(event) => setQuickNavQuery(event.target.value)}
                            className="quick-nav-input"
                        />
                        <div className="quick-nav-grid">
                            {filteredQuickLinks.length > 0 ? (
                                filteredQuickLinks.map((link) => (
                                    <Link key={link.to} to={link.to} className="quick-nav-item">
                                        <span>{link.label}</span>
                                        <small>{link.hint}</small>
                                    </Link>
                                ))
                            ) : (
                                <p className="rec-placeholder">No matching pages found.</p>
                            )}
                        </div>
                    </div>

                    <div className="recent-tests glass-card">
                        <h3>Recent Activity</h3>
                        <div className="test-list">
                            {[
                                { name: 'System Design Challenge #3', meta: 'Score: 85% • 2 days ago' },
                                { name: 'DSA Mock – Arrays & Strings', meta: 'Score: 91% • 4 days ago' },
                                { name: 'Google Aptitude Round', meta: 'Score: 78% • 1 week ago' },
                            ].map((t, i) => (
                                <div key={i} className="test-item">
                                    <div>
                                        <div className="test-name">{t.name}</div>
                                        <div className="test-meta">{t.meta}</div>
                                    </div>
                                    <button className="view-btn">View</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="right-column">
                    <div className="daily-challenge glass-card highlight">
                        <div className="card-badge">DAILY BOOST</div>
                        <h3>Today's Challenge</h3>
                        {loading ? (
                            <p className="loading-text pulse">Loading today's challenge…</p>
                        ) : dailyChallenge ? (
                            <div className="challenge-content">
                                <h4>{dailyChallenge.title}</h4>
                                <p>{dailyChallenge.category}</p>
                                <div className={`difficulty-tag ${dailyChallenge.difficulty?.toLowerCase()}`}>
                                    {dailyChallenge.difficulty}
                                </div>
                                <button className="primary-cta challenge-btn">
                                    Solve for 100 XP ⚡
                                </button>
                            </div>
                        ) : (
                            <div className="challenge-content">
                                <h4>Two Sum – Classic</h4>
                                <p>Algorithms</p>
                                <div className="difficulty-tag easy">Easy</div>
                                <button className="primary-cta challenge-btn">
                                    Solve for 100 XP ⚡
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="ai-recommendations glass-card">
                        <div className="rec-header">
                            <Sparkles size={18} className="sparkle-icon" />
                            <h3>AI Recommendations</h3>
                        </div>
                        <div className="rec-list">
                            {recommendations.length > 0 ? (
                                recommendations.slice(0, 4).map((rec, i) => (
                                    <div key={i} className="rec-item">
                                        <div className="rec-info">
                                            <span className="rec-title">{rec.title}</span>
                                            <span className="rec-tag">{rec.category}</span>
                                        </div>
                                        <div className="rec-xp">+50 XP</div>
                                    </div>
                                ))
                            ) : (
                                <>
                                    {[
                                        { title: 'Binary Search Patterns', tag: 'DSA' },
                                        { title: 'System Design Intro', tag: 'HLD' },
                                        { title: 'SQL Window Functions', tag: 'Database' },
                                    ].map((r, i) => (
                                        <div key={i} className="rec-item">
                                            <div className="rec-info">
                                                <span className="rec-title">{r.title}</span>
                                                <span className="rec-tag">{r.tag}</span>
                                            </div>
                                            <div className="rec-xp">+50 XP</div>
                                        </div>
                                    ))}
                                    <p className="rec-placeholder">
                                        Complete more tests for personalised AI paths!
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="study-planner glass-card">
                        <div className="study-planner-header">
                            <CheckCircle size={18} className="planner-icon" />
                            <h3>Study Planner</h3>
                        </div>
                        <p className="study-planner-meta">
                            {studyTasks.length === 0
                                ? 'Plan today with small, focused goals.'
                                : `${completedStudyTasks}/${studyTasks.length} tasks completed`}
                        </p>

                        <form className="study-planner-form" onSubmit={addStudyTask}>
                            <input
                                type="text"
                                value={studyTaskInput}
                                onChange={(event) => setStudyTaskInput(event.target.value)}
                                placeholder="Add a task (e.g. Solve 2 DP questions)"
                                maxLength={80}
                            />
                            <button type="submit" className="secondary-cta">Add</button>
                        </form>

                        <div className="study-planner-list">
                            {studyTasks.length > 0 ? (
                                studyTasks.map((task) => (
                                    <div key={task.id} className={`study-task ${task.done ? 'done' : ''}`}>
                                        <button
                                            type="button"
                                            className="study-task-toggle"
                                            onClick={() => toggleStudyTask(task.id)}
                                            aria-label={task.done ? 'Mark task as pending' : 'Mark task as complete'}
                                        >
                                            <CheckCircle size={16} />
                                        </button>
                                        <span className="study-task-title">{task.title}</span>
                                        <button
                                            type="button"
                                            className="study-task-remove"
                                            onClick={() => removeStudyTask(task.id)}
                                            aria-label="Remove task"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="rec-placeholder">No tasks yet. Add your first study goal above.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Dashboard
