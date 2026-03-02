import React from 'react'
import Sidebar from '../components/Sidebar'
import { motion } from 'framer-motion'
import { Trophy, ArrowUpRight, Award } from 'lucide-react'
// import './Results.css' // We'll create this or use common styles

const Results = () => {
    const previousResults = [
        { title: 'Google Mock #1', score: '85%', date: '2026-02-24', status: 'Passed' },
        { title: 'Amazon Aptitude', score: '92%', date: '2026-02-22', status: 'Passed' },
        { title: 'TCS NQT Prep', score: '65%', date: '2026-02-20', status: 'Average' },
    ];

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content">
                <header className="dashboard-header">
                    <h1>My <span className="gradient-text">Results</span></h1>
                    <p>Track your performance and identify areas for improvement.</p>
                </header>

                <div className="results-container">
                    <div className="overall-performance glass-card">
                        <div className="perf-header">
                            <h3>Overall Growth</h3>
                            <Award className="accent-icon" />
                        </div>
                        <div className="chart-placeholder">
                            {/* Performance Chart would go here */}
                            <div className="bars">
                                {[40, 60, 55, 80, 75, 90].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        className="bar"
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ delay: i * 0.1 }}
                                    ></motion.div>
                                ))}
                            </div>
                        </div>
                        <p className="perf-summary">Your score has improved by 15% in the last 30 days!</p>
                    </div>

                    <div className="results-history glass-card">
                        <h3>Test History</h3>
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>Test Name</th>
                                    <th>Score</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previousResults.map((res, i) => (
                                    <tr key={i}>
                                        <td>{res.title}</td>
                                        <td>{res.score}</td>
                                        <td>{res.date}</td>
                                        <td><span className={`badge ${res.status.toLowerCase()}`}>{res.status}</span></td>
                                        <td><button className="view-link">Details <ArrowUpRight size={14} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
        .chart-placeholder {
          height: 150px;
          display: flex;
          align-items: flex-end;
          gap: 10px;
          margin: 20px 0;
          padding: 10px;
          background: rgba(255,255,255,0.02);
          border-radius: 10px;
        }
        .bar {
          flex: 1;
          background: var(--primary);
          border-radius: 4px 4px 0 0;
        }
        .results-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        .results-table th, .results-table td {
          text-align: left;
          padding: 1rem;
          border-bottom: 1px solid var(--glass-border);
        }
        .badge.passed { color: #27c93f; background: rgba(39, 201, 63, 0.1); padding: 4px 8px; border-radius: 4px; }
        .badge.average { color: #ffbd2e; background: rgba(255, 189, 46, 0.1); padding: 4px 8px; border-radius: 4px; }
        .view-link { background: none; border: none; color: var(--primary); cursor: pointer; display: flex; align-items: center; gap: 4px; }
      `}} />
        </div>
    )
}

export default Results
