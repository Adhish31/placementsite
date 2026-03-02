import React from 'react'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'
import './Landing.css'

const Landing = () => {
    return (
        <div className="landing-page">
            <Navbar />

            <main className="hero-section">
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="hero-title">
                        Master Your <span className="gradient-text">Placements</span> <br />
                        With Confidence
                    </h1>
                    <p className="hero-subtitle">
                        The ultimate platform for mock tests, company-specific preparation,
                        and real-time analytics to help you land your dream job.
                    </p>
                    <div className="hero-cta">
                        <button className="primary-cta">Start Mock Test</button>
                        <button className="secondary-cta">Explore Companies</button>
                    </div>
                </motion.div>

                <motion.div
                    className="hero-visual"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="orb orb-1"></div>
                    <div className="orb orb-2"></div>
                    <div className="visual-card glass-card">
                        <div className="card-header">
                            <span className="dot red"></span>
                            <span className="dot yellow"></span>
                            <span className="dot green"></span>
                        </div>
                        <div className="card-content">
                            <h3>Next Challenge: Google Mock Test</h3>
                            <p>45 Questions • 60 Minutes</p>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: '65%' }}></div>
                            </div>
                            <p className="small-text">65% Prepared for Google interview</p>
                        </div>
                    </div>
                </motion.div>
            </main>

            <section className="features-section">
                <h2 className="section-title">Why Choose <span className="gradient-text">CareerQuest</span>?</h2>
                <div className="features-grid">
                    {[
                        { title: 'Mock Tests', desc: 'Real-time test environment with diverse question banks.' },
                        { title: 'Company Prep', desc: 'Curated materials for top tech giants like Google, Amazon, and MS.' },
                        { title: 'Analytics', desc: 'Detailed insights into your performance and growth.' },
                        { title: 'Daily Challenge', desc: 'New challenges every day to keep your skills sharp.' }
                    ].map((f, i) => (
                        <motion.div
                            key={i}
                            className="feature-card glass-card"
                            whileHover={{ y: -10 }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    )
}

export default Landing
