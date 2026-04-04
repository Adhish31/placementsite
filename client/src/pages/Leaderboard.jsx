import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';
import './Leaderboard.css';

const Leaderboard = () => {
    const leaders = [
        { rank: 1, name: "Adhish", score: 2850, college: "Sathyabama", badge: <Crown className="crown-icon" /> },
        { rank: 2, name: "Rahul S.", score: 2720, college: "IIT Madras", badge: <Medal style={{ color: 'silver' }} /> },
        { rank: 3, name: "Priya K.", score: 2680, college: "VIT Vellore", badge: <Medal style={{ color: '#cd7f32' }} /> },
        { rank: 4, name: "Simran", score: 2550, college: "SRM IST" },
        { rank: 5, name: "Karthik", score: 2420, college: "Anna University" },
        { rank: 6, name: "Ananya", score: 2300, college: "BIT Mesra" },
        { rank: 7, name: "Vijay", score: 2210, college: "NIT Trichy" },
    ];

    return (
        <>
            <header className="dashboard-header">
                <h1>Global <span className="gradient-text">Leaderboard</span></h1>
                <p>Compete with students across the country and climb to the top.</p>
            </header>

            <div className="leaderboard-top-section">
                <div className="top-three">
                    {/* 2nd Place */}
                    <motion.div className="podium silver" initial={{ height: 0 }} animate={{ height: 180 }} transition={{ delay: 0.2 }}>
                        <div className="podium-avatar">R</div>
                        <span className="podium-name">Rahul S.</span>
                        <span className="podium-rank">#2</span>
                    </motion.div>
                    {/* 1st Place */}
                    <motion.div className="podium gold" initial={{ height: 0 }} animate={{ height: 240 }} transition={{ delay: 0.1 }}>
                        <Crown className="gold-crown" />
                        <div className="podium-avatar">A</div>
                        <span className="podium-name">Adhish</span>
                        <span className="podium-rank">#1</span>
                    </motion.div>
                    {/* 3rd Place */}
                    <motion.div className="podium bronze" initial={{ height: 0 }} animate={{ height: 150 }} transition={{ delay: 0.3 }}>
                        <div className="podium-avatar">P</div>
                        <span className="podium-name">Priya K.</span>
                        <span className="podium-rank">#3</span>
                    </motion.div>
                </div>
            </div>

            <div className="leaderboard-container glass-card">
                <table className="leaderboard-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Name</th>
                            <th>Institute</th>
                            <th>Score (XP)</th>
                            <th>Growth</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaders.map((user, i) => (
                            <motion.tr
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={user.name === "Adhish" ? "me" : ""}
                            >
                                <td>
                                    <div className="rank-cell">
                                        {user.rank} {user.badge}
                                    </div>
                                </td>
                                <td className="name-bold">{user.name}</td>
                                <td className="college-dim">{user.college}</td>
                                <td className="score-purple">{user.score}</td>
                                <td><TrendingUp size={16} color="#27c93f" /></td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default Leaderboard;
