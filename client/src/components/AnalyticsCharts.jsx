import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { motion } from 'framer-motion';

const AnalyticsCharts = () => {
    // Mock Data
    const trendData = [
        { name: 'Test 1', score: 65, avg: 60 },
        { name: 'Test 2', score: 72, avg: 62 },
        { name: 'Test 3', score: 68, avg: 65 },
        { name: 'Test 4', score: 85, avg: 68 },
        { name: 'Test 5', score: 78, avg: 70 },
        { name: 'Test 6', score: 92, avg: 72 },
    ];

    const topicData = [
        { name: 'DSA', value: 400 },
        { name: 'Aptitude', value: 300 },
        { name: 'OS', value: 200 },
        { name: 'DBMS', value: 150 },
    ];

    const weakAreas = [
        { topic: 'Dynamic Programming', progress: 35, color: '#ff5f56' },
        { topic: 'System Design', progress: 45, color: '#ffbd2e' },
        { topic: 'B-Trees', progress: 55, color: '#4cc9f0' },
    ];

    const COLORS = ['#9d4edd', '#4cc9f0', '#27c93f', '#ffbd2e'];

    return (
        <div className="analytics-grid">
            {/* Performance Trend */}
            <motion.div
                className="chart-card glass-card span-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h3>Score Trend</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="#adb5bd" fontSize={12} />
                            <YAxis stroke="#adb5bd" fontSize={12} />
                            <Tooltip
                                contentStyle={{ background: 'rgba(26, 26, 29, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '10px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Line type="monotone" dataKey="score" stroke="#9d4edd" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="avg" stroke="#4cc9f0" strokeDasharray="5 5" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Topic Distribution */}
            <motion.div
                className="chart-card glass-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                <h3>Topic Performance</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={topicData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {topicData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: 'rgba(26, 26, 29, 0.9)', border: 'none', borderRadius: '10px' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Weak Areas */}
            <motion.div
                className="chart-card glass-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h3>Improvement Areas</h3>
                <div className="weak-areas-list">
                    {weakAreas.map((area, i) => (
                        <div key={i} className="weak-area-item">
                            <div className="area-info">
                                <span>{area.topic}</span>
                                <span>{area.progress}% Mastery</span>
                            </div>
                            <div className="mini-progress-bar">
                                <motion.div
                                    className="mini-progress-fill"
                                    style={{ width: `${area.progress}%`, background: area.color }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${area.progress}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-top: 2rem;
        }
        .chart-card {
          padding: 1.5rem;
          min-height: 400px;
        }
        .chart-card h3 {
          margin-bottom: 1.5rem;
          font-size: 1.1rem;
          color: var(--text-dim);
        }
        .span-2 {
          grid-column: span 2;
        }
        .weak-areas-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-top: 1rem;
        }
        .weak-area-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .area-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }
        .mini-progress-bar {
          height: 6px;
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
          overflow: hidden;
        }
        .mini-progress-fill {
          height: 100%;
          border-radius: 3px;
        }

        @media (max-width: 1024px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }
          .span-2 {
            grid-column: span 1;
          }
        }
      `}} />
        </div>
    );
};

export default AnalyticsCharts;
