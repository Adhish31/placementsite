import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, LineChart, Line, RadarChart, Radar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
    TrendingUp, Zap, Volume2, Brain, Mic, Target,
    AlertCircle, CheckCircle, Award, Clock, ThermometerSun
} from 'lucide-react';

/**
 * Interview Analytics Dashboard
 * Displays Phase 1-5 AI Analysis Results
 */

const InterviewAnalytics = ({ sessionData, isLoading = false }) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (isLoading) {
        return (
            <div className="analytics-container">
                <div className="loading-spinner">Analyzing your interview...</div>
            </div>
        );
    }

    if (!sessionData) {
        return <div className="analytics-container">No data available</div>;
    }

    const {
        // Phase 2: NLP Scores
        clarity = 0,
        relevance = 0,
        technical_depth = 0,
        keywords_matched = [],

        // Phase 3: Classification
        readiness_status = 'Not Ready',
        readiness_score = 60,
        weak_areas = [],
        strong_areas = [],

        // Phase 4: Progress
        progress = {},

        // Phase 5: Speech Analysis
        speech_analysis = {},
    } = sessionData;

    // Prepare data for visualizations
    const scoreData = [
        { name: 'Clarity', value: clarity * 10, max: 100 },
        { name: 'Relevance', value: relevance * 10, max: 100 },
        { name: 'Technical Depth', value: technical_depth * 10, max: 100 },
    ];

    const radarData = [
        { subject: 'Clarity', A: clarity, fullMark: 10 },
        { subject: 'Relevance', A: relevance, fullMark: 10 },
        { subject: 'Technical Depth', A: technical_depth, fullMark: 10 },
    ];

    const progressData = [
        { name: 'Current', value: progress.current_score || readiness_score },
        { name: 'Previous', value: progress.previous_score || 0 },
    ];

    return (
        <div className="analytics-dashboard">
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* HEADER: Overall Score & Status */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="analytics-header">
                <div className="score-circle">
                    <div className={`score-number ${readiness_status.toLowerCase()}`}>
                        {readiness_score}
                    </div>
                    <p className="score-label">Readiness Score</p>
                </div>

                <div className="status-info">
                    <h2>Interview Status</h2>
                    <div className={`status-badge ${readiness_status.toLowerCase()}`}>
                        {readiness_status === 'Ready' ? <CheckCircle /> : <AlertCircle />}
                        <span>{readiness_status} for Interview</span>
                    </div>

                    {progress.estimated_ready_date && (
                        <p className="estimated-date">
                            📅 {progress.estimated_ready_date}
                        </p>
                    )}

                    <div className="trend-indicator">
                        <TrendingUp size={20} />
                        <span>{progress.trend || 'Stable'} trend</span>
                        {progress.improvement_rate && (
                            <span className="rate">{Math.abs(progress.improvement_rate)}%</span>
                        )}
                    </div>
                </div>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* TABS */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="analytics-tabs">
                {['overview', 'speech', 'progress', 'recommendations'].map(tab => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* TAB 1: Overview (Phase 2 & 3) */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {activeTab === 'overview' && (
                <div className="tab-content">
                    <div className="grid-2">
                        {/* NLP Scores Bar Chart */}
                        <div className="chart-card">
                            <h3>📊 NLP Analysis (Phase 2)</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={scoreData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#10b981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Radar Chart */}
                        <div className="chart-card">
                            <h3>🎯 Skill Radar</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <RadarChart data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis angle={90} domain={[0, 10]} />
                                    <Radar name="Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Keywords Matched */}
                    <div className="keywords-section">
                        <h3>🔑 Keywords Detected</h3>
                        <div className="keywords-list">
                            {keywords_matched && keywords_matched.length > 0 ? (
                                keywords_matched.map(kw => (
                                    <span key={kw} className="keyword-badge">
                                        {kw}
                                    </span>
                                ))
                            ) : (
                                <p>No keywords matched</p>
                            )}
                        </div>
                    </div>

                    {/* Strengths & Weak Areas */}
                    <div className="grid-2">
                        <div className="insights-card success">
                            <h4>✅ Strong Areas</h4>
                            {strong_areas && strong_areas.length > 0 ? (
                                <ul>
                                    {strong_areas.map((area, i) => (
                                        <li key={i}>{area}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p>Keep practicing to build strengths</p>
                            )}
                        </div>

                        <div className="insights-card warning">
                            <h4>⚠️ Areas for Improvement</h4>
                            {weak_areas && weak_areas.length > 0 ? (
                                <ul>
                                    {weak_areas.map((area, i) => (
                                        <li key={i}>{area}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p>Excellent! No major weak areas identified</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* TAB 2: Speech Analysis (Phase 5) */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {activeTab === 'speech' && (
                <div className="tab-content">
                    <div className="grid-2">
                        {/* Speech Metrics */}
                        <div className="metrics-grid">
                            <MetricCard
                                icon={<Mic size={24} />}
                                label="Tone"
                                value={speech_analysis.tone || 'N/A'}
                                color="blue"
                            />
                            <MetricCard
                                icon={<Volume2 size={24} />}
                                label="Speech Rate (WPM)"
                                value={`${speech_analysis.speech_rate || 0}`}
                                color="green"
                            />
                            <MetricCard
                                icon={<Zap size={24} />}
                                label="Energy Level"
                                value={speech_analysis.energy_level || 'N/A'}
                                color="purple"
                            />
                            <MetricCard
                                icon={<Brain size={24} />}
                                label="Clarity Score"
                                value={`${speech_analysis.clarity_score || 0}%`}
                                color="orange"
                            />
                        </div>

                        {/* Filler Words Analysis */}
                        <div className="chart-card">
                            <h3>🎤 Speech Patterns</h3>
                            <div className="speech-details">
                                <div className="detail-row">
                                    <span>Filler Words (um, uh, like):</span>
                                    <strong>{speech_analysis.filler_words || 0}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Tone:</span>
                                    <strong>{speech_analysis.tone || 'Neutral'}</strong>
                                </div>
                                <div className="detail-row">
                                    <span>Avg. Pause Duration:</span>
                                    <strong>
                                        {speech_analysis.pause_analysis?.average_pause_duration?.toFixed(2) || 'N/A'}s
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Speech Tips */}
                    <div className="tips-card">
                        <h3>💡 Speech Improvement Tips</h3>
                        <ul>
                            {speech_analysis.tone === 'Nervous' && (
                                <li>✓ Practice breathing exercises to reduce nervousness</li>
                            )}
                            {(speech_analysis.filler_words || 0) > 5 && (
                                <li>✓ Practice pausing instead of using filler words like "um" and "uh"</li>
                            )}
                            {speech_analysis.speech_rate < 100 && (
                                <li>✓ Speak slightly faster to convey confidence</li>
                            )}
                            {speech_analysis.speech_rate > 150 && (
                                <li>✓ Slow down your speech pace for better clarity</li>
                            )}
                            <li>✓ Record yourself to identify and eliminate speech patterns</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* TAB 3: Progress (Phase 4) */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {activeTab === 'progress' && (
                <div className="tab-content">
                    <div className="chart-card full-width">
                        <h3>📈 Progress Tracking (Phase 4 - LSTM)</h3>
                        {progress.trend ? (
                            <>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={progressData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#8b5cf6"
                                            strokeWidth={2}
                                            name="Readiness Score"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>

                                <div className="progress-info">
                                    <div className="info-row">
                                        <span>Trend:</span>
                                        <strong className={`trend-${progress.trend?.toLowerCase()}`}>
                                            {progress.trend}
                                        </strong>
                                    </div>
                                    <div className="info-row">
                                        <span>Improvement Rate:</span>
                                        <strong>{progress.improvement_rate || 0}%</strong>
                                    </div>
                                    <div className="info-row">
                                        <span>Estimated Ready Date:</span>
                                        <strong>{progress.estimated_ready_date || 'Keep practicing'}</strong>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p>Complete more interviews to see progress tracking</p>
                        )}
                    </div>
                </div>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* TAB 4: Recommendations */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {activeTab === 'recommendations' && (
                <div className="tab-content">
                    <div className="recommendations-grid">
                        {weak_areas && weak_areas.length > 0 && (
                            <div className="recommendation-card">
                                <h4>🎯 Focus Areas</h4>
                                {weak_areas.map((area, i) => (
                                    <div key={i} className="rec-item">
                                        <Target size={18} />
                                        <div>
                                            <p className="rec-title">{area}</p>
                                            <p className="rec-description">
                                                Practice and strengthen this area in your next interview
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="recommendation-card">
                            <h4>📚 Study Resources</h4>
                            <div className="rec-item">
                                <Award size={18} />
                                <div>
                                    <p className="rec-title">Technical Depth</p>
                                    <p className="rec-description">
                                        Review core concepts and practice with similar questions
                                    </p>
                                </div>
                            </div>
                            <div className="rec-item">
                                <Mic size={18} />
                                <div>
                                    <p className="rec-title">Communication</p>
                                    <p className="rec-description">
                                        Practice clear explanations with examples and metrics
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="recommendation-card">
                            <h4>📅 Next Steps</h4>
                            <div className="rec-item">
                                <Clock size={18} />
                                <div>
                                    <p className="rec-title">Schedule Another Interview</p>
                                    <p className="rec-description">
                                        Take another interview in 2-3 days to practice improvements
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Metric Card Component
 */
const MetricCard = ({ icon, label, value, color = 'blue' }) => {
    return (
        <div className={`metric-card metric-${color}`}>
            <div className="metric-icon">{icon}</div>
            <p className="metric-label">{label}</p>
            <p className="metric-value">{value}</p>
        </div>
    );
};

export default InterviewAnalytics;
