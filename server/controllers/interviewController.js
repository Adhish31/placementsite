const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');

const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');

/**
 * AI System Architect - Enhanced Interview Controller
 * 📊 Phases 1-5 Implementation
 * - Phase 1: Collect user answers via transcription
 * - Phase 2: NLP analysis (BERT scores)
 * - Phase 3: ML classification (Ready/Not Ready)
 * - Phase 4: Progress tracking (LSTM trends)
 * - Phase 5: Speech analysis (tone, pauses)
 */

// ── PHASE 1: Start Interview Session ──
exports.startInterview = async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.user?.id;

        // Validate role
        if (!role) {
            return res.status(400).json({ message: 'Role is required' });
        }

        // Call Python ML service for first question
        const pythonResponse = await axios.post(`${ML_SERVICE_URL}/start-interview`, 
            { role }
        );

        // Prepare response
        const response = {
            question: pythonResponse.data.question
        };

        // Try to create interview session document if user is authenticated
        try {
            if (userId) {
                const session = new InterviewSession({
                    user: userId,
                    role,
                    domain: _getRoleDomain(role),
                    status: 'In Progress',
                    startTime: new Date()
                });
                
                await session.save();
                response.sessionId = session._id;
            }
        } catch (dbErr) {
            console.warn('DB Session Save Warning:', dbErr.message);
            // Continue even if session save fails - don't block the interview
        }

        res.json(response);
    } catch (err) {
        console.error('Interview Start Error:', err.message, err.response?.data);
        res.status(500).json({ 
            message: 'AI service unreachable', 
            error: err.message 
        });
    }
};

// ── PHASE 2-5: Process Answer + All AI Analysis ──
exports.submitAnswer = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No audio uploaded");
        }

        const { role, history, sessionId, question } = req.body;
        const userId = req.user?.id;

        if (!role) {
            return res.status(400).json({ message: 'Role is required' });
        }

        const formData = new FormData();
        
        // Attach audio file
        formData.append('audio_file', fs.createReadStream(req.file.path));
        formData.append('role', role);
        formData.append('history', history || '[]');
        formData.append('question', question || '');

        // Send to Python ML service
        // Returns: Phase 1-5 analysis
        const aiResponse = await axios.post(
            `${ML_SERVICE_URL}/submit-answer`, 
            formData, 
            {
                headers: formData.getHeaders(),
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 60000
            }
        );

        // Cleanup audio file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        // ── Update interview session with analysis results ──
        if (userId && sessionId) {
            try {
                const session = await InterviewSession.findById(sessionId);
                
                if (session) {
                    // Store processed answer
                    session.answers.push({
                        questionId: new Date().getTime(), // Use timestamp as ID
                        transcription: aiResponse.data.transcription,
                        fillerCount: aiResponse.data.fillers_detected || 0,
                        duration: Math.floor((req.file.size / 8) / 16000), // Rough estimate
                    });

                    // Store NLP analysis scores
                    session.answerScores.push({
                        questionId: new Date().getTime(),
                        clarity: aiResponse.data.clarity || 0,
                        relevance: aiResponse.data.relevance || 0,
                        technicalDepth: aiResponse.data.technical_depth || 0,
                        keywordsMatched: aiResponse.data.keywords_matched || [],
                        weakAreas: aiResponse.data.weak_areas || [],
                        feedback: aiResponse.data.feedback || '',
                    });

                    // Update session metrics
                    session.metrics = {
                        readinessScore: aiResponse.data.readiness_score || 60,
                        readinessStatus: aiResponse.data.readiness_status || 'Not Ready',
                        identifiedWeakAreas: aiResponse.data.weak_areas || [],
                        communicationScore: Math.max(0, Math.min(100, (aiResponse.data.clarity || 5) * 10)),
                        technicalScore: Math.max(0, Math.min(100, (aiResponse.data.technical_depth || 5) * 10)),
                        confidenceScore: aiResponse.data.confidence_score || 50,
                    };

                    // Store speech analysis (Phase 5)
                    if (aiResponse.data.speech_analysis) {
                        session.speechAnalysis = aiResponse.data.speech_analysis;
                    }

                    // Update progress tracking (Phase 4)
                    if (aiResponse.data.progress) {
                        session.progressTracking = aiResponse.data.progress;
                    }

                    session.updatedAt = new Date();
                    await session.save();
                }
            } catch (dbErr) {
                console.error('Error saving interview session:', dbErr);
                // Continue even if DB save fails
            }
        }

        // Return comprehensive response
        res.json({
            // Phase 1: Transcription
            transcription: aiResponse.data.transcription,
            
            // Phase 2: NLP Scores
            clarity: aiResponse.data.clarity,
            relevance: aiResponse.data.relevance,
            technical_depth: aiResponse.data.technical_depth,
            keywords_matched: aiResponse.data.keywords_matched,
            
            // Phase 3: Classification
            readiness_status: aiResponse.data.readiness_status,
            readiness_score: aiResponse.data.readiness_score,
            weak_areas: aiResponse.data.weak_areas,
            strong_areas: aiResponse.data.strong_areas,
            
            // Phase 4: Progress
            progress: aiResponse.data.progress,
            
            // Phase 5: Speech Analysis
            speech_analysis: aiResponse.data.speech_analysis,
            
            // UI Display
            next_question: aiResponse.data.next_question,
            feedback: aiResponse.data.feedback,
            rating: aiResponse.data.rating,
            confidence_score: aiResponse.data.confidence_score,
            fillers_detected: aiResponse.data.fillers_detected,
            status_label: aiResponse.data.status_label,
        });

    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Interview Analysis Error:', err.message);
        res.status(500).json({ 
            message: 'AI analysis failed', 
            error: err.message 
        });
    }
};

// ── Session Management ──

exports.endInterview = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const userId = req.user?.id;

        if (!sessionId) {
            return res.status(400).json({ message: 'Session ID is required' });
        }

        const session = await InterviewSession.findById(sessionId);

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Only user's own session can be ended
        if (session.user.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        session.status = 'Completed';
        session.endTime = new Date();
        session.duration = Math.floor((session.endTime - session.startTime) / 1000);

        // Calculate final feedback
        session.feedback = _generateSessionFeedback(session);

        await session.save();

        res.json({ 
            message: 'Interview ended',
            session 
        });

    } catch (err) {
        console.error('End Interview Error:', err.message);
        res.status(500).json({ message: 'Failed to end interview', error: err.message });
    }
};

exports.getSessionHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { role } = req.query;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        let query = { user: userId };
        if (role) query.role = role;

        const sessions = await InterviewSession.find(query)
            .sort({ createdAt: -1 })
            .select('role metrics progressTracking speechAnalysis startTime duration status');

        res.json(sessions);

    } catch (err) {
        console.error('Get Session History Error:', err.message);
        res.status(500).json({ message: 'Failed to retrieve history', error: err.message });
    }
};

exports.getSessionDetail = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.id;

        if (!sessionId) {
            return res.status(400).json({ message: 'Session ID is required' });
        }

        const session = await InterviewSession.findById(sessionId);

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Check authorization
        if (session.user.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        res.json(session);

    } catch (err) {
        console.error('Get Session Detail Error:', err.message);
        res.status(500).json({ message: 'Failed to retrieve session', error: err.message });
    }
};

// ── Analytics & Progress ──

exports.getProgress = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { role } = req.query;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        let query = { user: userId, status: 'Completed' };
        if (role) query.role = role;

        const sessions = await InterviewSession.find(query)
            .sort({ createdAt: 1 })
            .select('metrics progressTracking createdAt');

        // Calculate trend
        if (sessions.length < 2) {
            return res.json({
                trend: 'Not enough data',
                sessions: sessions.map(_formatSessionForAnalytics),
                recommendation: 'Complete more interviews to see your progress'
            });
        }

        const scores = sessions.map(s => s.metrics?.readinessScore || 60);
        const improvement = _calculateImprovement(scores);

        res.json({
            trend: improvement.trend,
            improvement_rate: improvement.improvement_rate,
            current_score: improvement.current_score,
            previous_score: improvement.previous_score,
            sessions: sessions.map(_formatSessionForAnalytics),
            recommendation: improvement.recommendation
        });

    } catch (err) {
        console.error('Get Progress Error:', err.message);
        res.status(500).json({ message: 'Failed to retrieve progress', error: err.message });
    }
};

// ════════════════════════════════════════════════════════════════════
// ▼ Helper Functions
// ════════════════════════════════════════════════════════════════════

function _getRoleDomain(role) {
    const mapping = {
        'Frontend Developer': 'Web Development',
        'Backend Developer': 'Backend',
        'Full Stack Developer': 'Full Stack',
        'Data Scientist': 'Data Science',
        'DevOps Engineer': 'DevOps'
    };
    return mapping[role] || 'General';
}

function _generateSessionFeedback(session) {
    const metrics = session.metrics || {};
    const readinessScore = metrics.readinessScore || 60;
    
    let summary = '';
    if (readinessScore >= 80) {
        summary = 'Excellent performance! You demonstrated strong technical knowledge and communication skills.';
    } else if (readinessScore >= 70) {
        summary = 'Good job! You showed solid understanding. Focus on the weak areas identified above.';
    } else if (readinessScore >= 50) {
        summary = 'Getting there! With more practice on the identified weak areas, you\'ll improve quickly.';
    } else {
        summary = 'Keep practicing! Technical interviews require consistent preparation.';
    }

    return {
        overallFeedback: summary,
        positivePoints: metrics.communicationScore > 70 ? ['Strong communication'] : [],
        areasForImprovement: metrics.technicalScore < 60 ? ['Technical depth'] : [],
        sessionSummary: `Interview lasted ${session.duration || 0} seconds with ${session.answerScores?.length || 0} questions.`
    };
}

function _formatSessionForAnalytics(session) {
    return {
        createdAt: session.createdAt,
        readinessScore: session.metrics?.readinessScore || 60,
        communicationScore: session.metrics?.communicationScore || 0,
        technicalScore: session.metrics?.technicalScore || 0,
        trend: session.progressTracking?.trend || 'Stable'
    };
}

function _calculateImprovement(scores) {
    if (scores.length < 2) {
        return {
            trend: 'Not enough data',
            improvement_rate: 0,
            current_score: scores[0] || 0,
            previous_score: 0,
            recommendation: 'Complete more interviews to track progress'
        };
    }

    const recent_avg = scores.slice(-3).reduce((a, b) => a + b, 0) / Math.min(scores.length, 3);
    const early_avg = scores.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(scores.length, 3);
    const improvement_rate = ((recent_avg - early_avg) / (early_avg || 1)) * 100;

    let trend = 'Stable';
    let recommendation = 'Continue your current study routine.';

    if (improvement_rate > 5) {
        trend = 'Improving';
        recommendation = 'Great progress! Keep up with your practice.';
    } else if (improvement_rate < -5) {
        trend = 'Declining';
        recommendation = 'Focus on consistency and revisit weak areas.';
    }

    return {
        trend,
        improvement_rate: parseFloat(improvement_rate.toFixed(2)),
        current_score: Math.round(recent_avg),
        previous_score: Math.round(early_avg),
        recommendation
    };
}

module.exports.health = async (req, res) => {
    try {
        const healthCheck = await axios.get(`${ML_SERVICE_URL}/health`);
        res.json({
            status: 'ok',
            ml_service: healthCheck.data.models
        });
    } catch (err) {
        res.status(503).json({
            status: 'degraded',
            message: 'ML service unavailable'
        });
    }
};
