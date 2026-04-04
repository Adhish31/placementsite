import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    Code2, Building2, BarChart3, Zap,
    Brain, Trophy, Users, ArrowRight,
    CheckCircle, Star, ChevronRight
} from 'lucide-react'
import './Landing.css'

const STATS = [
    { value: '50K+', label: 'Students Placed' },
    { value: '200+', label: 'Mock Test Templates' },
    { value: '95%', label: 'Satisfaction Rate' },
    { value: '350+', label: 'Companies Covered' },
]

const FEATURES = [
    {
        icon: <Code2 size={28} />,
        title: 'Live Code Compiler',
        desc: 'Write, compile and run code in 10+ languages directly in the browser. No setup needed.',
        color: '#9d4edd'
    },
    {
        icon: <Building2 size={28} />,
        title: 'Company-Specific Prep',
        desc: 'Curated question banks and study material for Google, Amazon, Microsoft and 350+ companies.',
        color: '#4cc9f0'
    },
    {
        icon: <Brain size={28} />,
        title: 'AI Resume Analyzer',
        desc: 'Upload your resume and get an instant ATS score, keyword analysis and actionable feedback.',
        color: '#c77dff'
    },
    {
        icon: <BarChart3 size={28} />,
        title: 'Real-time Analytics',
        desc: 'Track your scores, accuracy, time spent and growth with beautiful visual dashboards.',
        color: '#27c93f'
    },
    {
        icon: <Zap size={28} />,
        title: 'Daily XP Challenges',
        desc: 'Solve a new challenge every day to build a streak and climb the global leaderboard.',
        color: '#ffbd2e'
    },
    {
        icon: <Users size={28} />,
        title: 'Community Forum',
        desc: 'Share interview experiences, ask questions and connect with students across India.',
        color: '#ff5f56'
    },
]

const TESTIMONIALS = [
    { name: 'Priya Sharma', college: 'IIT Madras', company: 'Google SWE', text: 'CareerQuest was my go-to platform during placement season. The mock tests are incredibly realistic!' },
    { name: 'Rahul Verma', college: 'VIT Vellore', company: 'Amazon SDE-1', text: 'The AI resume analyzer spotted issues my seniors couldn\'t. Got an interview call within a week of fixing it.' },
    { name: 'Anjali Singh', college: 'NIT Trichy', company: 'Microsoft', text: 'The company-specific prep sections are gold. I felt fully prepared walking into my Microsoft interview.' },
]

const Landing = () => {
    const [activeTestimonial, setActiveTestimonial] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestimonial(prev => (prev + 1) % TESTIMONIALS.length)
        }, 4000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="landing-page">
            <Navbar />

            {/* ── Hero ── */}
            <main className="hero-section">
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="hero-badge">
                        <Zap size={14} /> #1 Placement Prep Platform in India
                    </div>
                    <h1 className="hero-title">
                        Master Your <span className="gradient-text">Placements</span>
                        <br />With Confidence
                    </h1>
                    <p className="hero-subtitle">
                        Mock tests, AI-powered resume analysis, company-specific prep,
                        and real-time analytics — everything to land your dream job.
                    </p>
                    <div className="hero-cta">
                        <Link to="/register" className="primary-cta cta-link">
                            Start for Free <ArrowRight size={18} />
                        </Link>
                        <Link to="/company-prep" className="secondary-cta cta-link">
                            Explore Companies
                        </Link>
                    </div>

                    <div className="hero-trust">
                        {['Google', 'Amazon', 'Microsoft', 'Meta', 'TCS'].map(c => (
                            <span key={c} className="trust-badge">{c}</span>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    className="hero-visual"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.9, delay: 0.15 }}
                >
                    <div className="orb orb-1" />
                    <div className="orb orb-2" />

                    <div className="hero-card-stack">
                        <div className="visual-card glass-card card-main">
                            <div className="card-header">
                                <span className="dot red" />
                                <span className="dot yellow" />
                                <span className="dot green" />
                                <span className="card-title-label">Google Mock Test</span>
                            </div>
                            <div className="card-content">
                                <h3>System Design Readiness</h3>
                                <p>45 Questions &bull; 60 Minutes</p>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: '72%' }} />
                                </div>
                                <div className="progress-row">
                                    <span className="small-text">72% Prepared</span>
                                    <span className="small-text" style={{ color: 'var(--accent-green)' }}>+12% this week</span>
                                </div>
                            </div>
                        </div>

                        <motion.div
                            className="floating-badge badge-xp glass-card"
                            animate={{ y: [0, -12, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <Trophy size={16} style={{ color: '#ffbd2e' }} />
                            <span>+150 XP Earned!</span>
                        </motion.div>

                        <motion.div
                            className="floating-badge badge-ai glass-card"
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                        >
                            <Brain size={16} style={{ color: '#c77dff' }} />
                            <span>AI Resume: 87/100</span>
                        </motion.div>
                    </div>
                </motion.div>
            </main>

            {/* ── Stats ── */}
            <section className="stats-section">
                {STATS.map((s, i) => (
                    <motion.div
                        key={i}
                        className="stat-item"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <span className="stat-big">{s.value}</span>
                        <span className="stat-lbl">{s.label}</span>
                    </motion.div>
                ))}
            </section>

            {/* ── Features ── */}
            <section className="features-section">
                <motion.div
                    className="section-header"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="section-tag">Everything You Need</span>
                    <h2 className="section-title">
                        Why Choose <span className="gradient-text">CareerQuest</span>?
                    </h2>
                    <p className="section-subtitle">
                        A complete ecosystem built by placement toppers, for placement toppers.
                    </p>
                </motion.div>

                <div className="features-grid">
                    {FEATURES.map((f, i) => (
                        <motion.div
                            key={i}
                            className="feature-card glass-card"
                            whileHover={{ y: -8, borderColor: f.color + '55' }}
                            initial={{ opacity: 0, y: 25 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.07 }}
                        >
                            <div className="feature-icon" style={{ background: f.color + '15', color: f.color }}>
                                {f.icon}
                            </div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                            <div className="feature-link">
                                Explore <ChevronRight size={16} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section className="testimonials-section">
                <motion.div
                    className="section-header"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <span className="section-tag">Success Stories</span>
                    <h2 className="section-title">Students Who <span className="gradient-text">Made It</span></h2>
                </motion.div>

                <div className="testimonials-grid">
                    {TESTIMONIALS.map((t, i) => (
                        <motion.div
                            key={i}
                            className={`testimonial-card glass-card ${i === activeTestimonial ? 'active' : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div className="t-stars">
                                {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="#ffbd2e" color="#ffbd2e" />)}
                            </div>
                            <p className="t-text">"{t.text}"</p>
                            <div className="t-author">
                                <div className="t-avatar">{t.name[0]}</div>
                                <div>
                                    <div className="t-name">{t.name}</div>
                                    <div className="t-meta">{t.college} → <span style={{ color: 'var(--accent-green)' }}>{t.company}</span></div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── CTA Banner ── */}
            <section className="cta-banner">
                <div className="cta-orb" />
                <motion.div
                    className="cta-content"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2>Ready to <span className="gradient-text">Get Placed?</span></h2>
                    <p>Join over 50,000 students who cracked their dream company with CareerQuest.</p>
                    <div className="cta-actions">
                        <Link to="/register" className="primary-cta cta-link">
                            Start Free Today <ArrowRight size={18} />
                        </Link>
                        <div className="cta-checks">
                            {['No credit card', 'Free forever plan', 'Cancel anytime'].map(c => (
                                <span key={c}><CheckCircle size={14} style={{ color: 'var(--accent-green)' }} /> {c}</span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ── Footer ── */}
            <footer className="landing-footer">
                <div className="footer-logo">Career<span>Quest</span></div>
                <p>© 2026 CareerQuest. Built for India's next generation of engineers.</p>
                <div className="footer-links">
                    <a href="#">Privacy</a>
                    <a href="#">Terms</a>
                    <a href="#">Contact</a>
                </div>
            </footer>
        </div>
    )
}

export default Landing
