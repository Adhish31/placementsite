import React from 'react';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';

const Leaderboard = () => {
    const leaders = [
        { rank: 1, name: "Adhish", score: 2850, college: "Sathyabama", badge: <Crown className="crown-icon" /> },
        { rank: 2, name: "Rahul S.", score: 2720, college: "IIT Madras", badge: <Medal style={{ color: '# silver' }} /> },
        { rank: 3, name: "Priya K.", score: 2680, college: "VIT Vellore", badge: <Medal style={{ color: '# cd7f32' }} /> },
        { rank: 4, name: "Simran", score: 2550, college: "SRM IST" },
        { rank: 5, name: "Karthik", score: 2420, college: "Anna University" },
        { rank: 6, name: "Ananya", score: 2300, college: "BIT Mesra" },
        { rank: 7, name: "Vijay", score: 2210, college: "NIT Trichy" },
    ];

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content">
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
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .leaderboard-top-section {
                    margin-bottom: 4rem;
                    display: flex;
                    justify-content: center;
                }
                .top-three {
                    display: flex;
                    align-items: flex-end;
                    gap: 2rem;
                    width: 100%;
                    max-width: 600px;
                    justify-content: center;
                }
                .podium {
                    flex: 1;
                    background: var(--glass);
                    border-radius: 20px 20px 0 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-end;
                    padding-bottom: 2rem;
                    position: relative;
                    border: 1px solid var(--glass-border);
                    border-bottom: none;
                }
                .podium.gold { background: linear-gradient(180deg, rgba(255, 189, 46, 0.15) 0%, rgba(255, 189, 46, 0.05) 100%); border-color: rgba(255, 189, 46, 0.3); }
                .podium.silver { background: linear-gradient(180deg, rgba(173, 181, 189, 0.15) 0%, rgba(173, 181, 189, 0.05) 100%); }
                .podium.bronze { background: linear-gradient(180deg, rgba(205, 127, 50, 0.15) 0%, rgba(205, 127, 50, 0.05) 100%); }
                
                .podium-avatar {
                    width: 60px;
                    height: 60px;
                    background: var(--primary);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                    box-shadow: 0 0 20px var(--primary-glow);
                }
                .podium-name { font-weight: 600; font-size: 0.9rem; }
                .podium-rank { font-size: 1.5rem; font-weight: 900; opacity: 0.5; }
                .gold-crown { position: absolute; top: -30px; color: #ffbd2e; width: 40px; height: 40px; }
                
                .leaderboard-container { padding: 1rem; }
                .leaderboard-table { width: 100%; border-collapse: collapse; }
                .leaderboard-table th, .leaderboard-table td { text-align: left; padding: 1.2rem 1rem; border-bottom: 1px solid var(--glass-border); }
                .leaderboard-table th { color: var(--text-dim); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
                
                .me { background: var(--primary-glow); transition: 0.3s; }
                .name-bold { font-weight: 600; }
                .college-dim { color: var(--text-dim); font-size: 0.9rem; }
                .score-purple { color: var(--primary); font-weight: 800; font-size: 1.1rem; }
                .rank-cell { display: flex; align-items: center; gap: 8px; font-weight: 700; }
                .crown-icon { color: #ffbd2e; width: 18px; }
            `}} />
        </div>
    );
};

export default Leaderboard;
