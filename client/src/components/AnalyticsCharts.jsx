import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion } from 'framer-motion';

const AnalyticsCharts = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [analytics, setAnalytics] = useState({
        summary: { currentScore: 0, estimatedReadinessDate: 'Need more sessions' },
        scoreTrend: [],
        confidenceTrend: [],
        topicPerformance: []
    });

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/interview/analytics/dashboard', {
                    headers: { 'x-auth-token': token || '' }
                });
                setAnalytics(res.data || analytics);
            } catch (err) {
                setError(err.response?.data?.message || 'Unable to load analytics.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const COLORS = ['#9d4edd', '#4cc9f0', '#27c93f', '#ffbd2e'];
    const trendData = (analytics.scoreTrend || []).map((x) => ({ name: x.date?.slice(5) || 'N/A', score: x.score }));
    const confidenceData = (analytics.confidenceTrend || []).map((x) => ({ name: x.date?.slice(5) || 'N/A', confidence: x.confidence }));
    const topicData = (analytics.topicPerformance || []).map((x) => ({ name: x.topic || 'general', value: x.attempts || 0, score: x.avgScore || 0 }));
    const weakAreas = (analytics.topicPerformance || [])
        .map((t) => ({ topic: t.topic, progress: t.avgScore, color: '#4cc9f0' }))
        .sort((a, b) => a.progress - b.progress)
        .slice(0, 3);

    return (
        <div className="analytics-grid">
            {loading && <div className="chart-card glass-card span-2"><h3>Loading analytics...</h3></div>}
            {!loading && error && <div className="chart-card glass-card span-2"><h3>{error}</h3></div>}
            {!loading && !error && (
                <>
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
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <motion.div
                className="chart-card glass-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                <h3>Confidence Improvement</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={confidenceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="name" stroke="#adb5bd" fontSize={12} />
                            <YAxis stroke="#adb5bd" fontSize={12} />
                            <Tooltip contentStyle={{ background: 'rgba(26, 26, 29, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '10px' }} />
                            <Line type="monotone" dataKey="confidence" stroke="#27c93f" strokeWidth={3} dot={{ r: 5 }} />
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
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                    Estimated readiness date: <b>{analytics.summary?.estimatedReadinessDate || 'Need more sessions'}</b>
                </div>
            </motion.div>
                </>
            )}

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
