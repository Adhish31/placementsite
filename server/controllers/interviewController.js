const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const mongoose = require('mongoose');
const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');
const Question = require('../models/Question');
const {
    buildInterviewReportPayload,
    renderInterviewReportPdf
} = require('../services/interviewReportPdf');

const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');

function _normalizeDifficulty(difficulty = 'medium') {
    const d = String(difficulty || '').toLowerCase();
    if (d === 'easy' || d === 'medium' || d === 'hard') return d;
    return 'medium';
}

function _computeTimeScoring(baseScore, timeTakenRaw, allottedTimeRaw) {
    const base = Number(baseScore || 60);
    const allotted = Math.max(30, Number(allottedTimeRaw || 75));
    const timeTaken = Math.max(0, Number(timeTakenRaw || 0));

    const tooShortThreshold = Math.max(12, Math.floor(allotted * 0.25));
    let penalty = 0;
    let reason = 'Good pacing.';

    if (timeTaken > 0 && timeTaken < tooShortThreshold) {
        penalty += 12;
        reason = 'Answer too short.';
    }

    if (timeTaken > allotted) {
        const overtime = timeTaken - allotted;
        penalty += Math.min(20, Math.ceil(overtime / 5) * 2);
        reason = 'Answer exceeded time limit.';
    }

    let timeEfficiency = 85;
    if (timeTaken === 0) {
        timeEfficiency = 40;
    } else if (timeTaken < tooShortThreshold) {
        timeEfficiency = Math.max(35, 55 - Math.round((tooShortThreshold - timeTaken) * 1.5));
    } else if (timeTaken <= allotted) {
        const usage = timeTaken / allotted; // 0..1
        timeEfficiency = Math.round(80 + usage * 20); // 80..100
    } else {
        const overtimeRatio = (timeTaken - allotted) / allotted;
        timeEfficiency = Math.max(40, Math.round(100 - overtimeRatio * 100));
    }

    const finalScore = Math.max(0, Math.min(100, Math.round((base * 0.85) + (timeEfficiency * 0.15) - penalty)));
    return { finalScore, timeEfficiency, timePenalty: penalty, timingReason: reason };
}

function _roleToQuestionRole(role = '') {
    const r = String(role || '').toLowerCase();
    if (r.includes('frontend')) return 'frontend';
    if (r.includes('backend')) return 'backend';
    return 'fullstack';
}

function _nextDifficulty(currentLevel, answerScore, confidenceScore) {
    const current = _normalizeDifficulty(currentLevel);
    const score = Number(answerScore || 0);
    const confidence = Number(confidenceScore || 0);

    let next = current;
    let reason = 'Maintained same level with variation.';

    if (score > 75 && confidence >= 60) {
        next = current === 'easy' ? 'medium' : 'hard';
        reason = 'High score (>75) with good confidence, increased difficulty.';
    } else if (score < 40 || confidence < 35) {
        next = current === 'hard' ? 'medium' : 'easy';
        reason = 'Low score (<40) or low confidence, decreased difficulty.';
    }

    return { next, reason };
}

async function _pickNextQuestion({ role, difficulty, excludeIds = [] }) {
    const query = {
        role: _roleToQuestionRole(role),
        difficulty: _normalizeDifficulty(difficulty),
        isDailyChallenge: false
    };

    if (excludeIds.length > 0) {
        query._id = { $nin: excludeIds };
    }

    const count = await Question.countDocuments(query);
    if (count <= 0) return null;

    const skip = Math.floor(Math.random() * count);
    const q = await Question.findOne(query).skip(skip);
    return q;
}

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
        const { role, companyMode } = req.body;
        const userId = req.user?.id;
        const normalizedCompanyMode = ['amazon', 'google', 'tcs'].includes((companyMode || '').toLowerCase())
            ? companyMode.toLowerCase()
            : 'general';

        // Validate role
        if (!role) {
            return res.status(400).json({ message: 'Role is required' });
        }

        // Call Python ML service for first question
        const pythonResponse = await axios.post(`${ML_SERVICE_URL}/start-interview`, 
            { role, company_mode: normalizedCompanyMode, current_difficulty: 'medium' }
        );

        // Prepare response
        const response = {
            question: pythonResponse.data.question,
            companyMode: pythonResponse.data.company_mode || normalizedCompanyMode
        };

        // Try to create interview session document if user is authenticated
        try {
            if (userId) {
                const session = new InterviewSession({
                    user: userId,
                    role,
                    companyMode: normalizedCompanyMode,
                    domain: _getRoleDomain(role),
                    status: 'In Progress',
                    startTime: new Date(),
                    adaptiveDifficulty: {
                        currentLevel: 'medium',
                        transitions: [{
                            to: 'medium',
                            answerScore: 0,
                            confidenceScore: 0,
                            reason: 'Initial interview difficulty.'
                        }]
                    }
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

        const { role, history, sessionId, question, timeTaken, allottedTime, autoSubmitted, companyMode } = req.body;
        const userId = req.user?.id;
        const normalizedCompanyMode = ['amazon', 'google', 'tcs'].includes((companyMode || '').toLowerCase())
            ? companyMode.toLowerCase()
            : 'general';
        let currentDifficultyForML = 'medium';

        if (sessionId) {
            try {
                const s = await InterviewSession.findById(sessionId).select('adaptiveDifficulty.currentLevel companyMode');
                if (s?.adaptiveDifficulty?.currentLevel) {
                    currentDifficultyForML = _normalizeDifficulty(s.adaptiveDifficulty.currentLevel);
                }
            } catch {
                currentDifficultyForML = 'medium';
            }
        }

        if (!role) {
            return res.status(400).json({ message: 'Role is required' });
        }

        const formData = new FormData();
        
        // Attach audio file
        formData.append('audio_file', fs.createReadStream(req.file.path));
        formData.append('role', role);
        formData.append('history', history || '[]');
        formData.append('question', question || '');
        formData.append('company_mode', normalizedCompanyMode);
        formData.append('current_difficulty', currentDifficultyForML);

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

        const timingScore = _computeTimeScoring(
            aiResponse.data.readiness_score || aiResponse.data.rating || 60,
            timeTaken,
            allottedTime
        );

        // ── Update interview session with analysis results + adaptive difficulty ──
        let adaptiveMeta = {
            previousDifficulty: 'medium',
            nextDifficulty: 'medium',
            transitionReason: 'Default adaptive state.',
            questionSource: 'ai'
        };

        let selectedNextQuestion = aiResponse.data.next_question;

        if (userId && sessionId) {
            try {
                const session = await InterviewSession.findById(sessionId);
                
                if (session) {
                    const previousDifficulty = _normalizeDifficulty(session.adaptiveDifficulty?.currentLevel || 'medium');
                    const answerScore = Number(timingScore.finalScore || 0);
                    const confidenceScore = Number(aiResponse.data.confidence_score || 0);
                    const transition = _nextDifficulty(previousDifficulty, answerScore, confidenceScore);

                    // Store processed answer
                    session.answers.push({
                        questionId: new Date().getTime(), // Use timestamp as ID
                        transcription: aiResponse.data.transcription,
                        fillerCount: aiResponse.data.fillers_detected || 0,
                        duration: Math.floor((req.file.size / 8) / 16000), // Rough estimate
                        timeTaken: Number(timeTaken || 0),
                        allottedTime: Number(allottedTime || 75),
                        autoSubmitted: String(autoSubmitted) === 'true'
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
                        detailedRubric: aiResponse.data.detailed_scores || undefined,
                        tutorFeedback: aiResponse.data.tutor_feedback
                            ? {
                                idealAnswer: aiResponse.data.tutor_feedback.ideal_answer || '',
                                comparison: aiResponse.data.tutor_feedback.comparison || '',
                                missingConcepts: aiResponse.data.tutor_feedback.missing_concepts || [],
                                weakAreas: aiResponse.data.tutor_feedback.weak_areas || [],
                                whatYouDidWell: aiResponse.data.tutor_feedback.what_you_did_well || [],
                                whatYouMissed: aiResponse.data.tutor_feedback.what_you_missed || [],
                                howToImprove: aiResponse.data.tutor_feedback.how_to_improve || []
                            }
                            : undefined,
                        timeEfficiency: timingScore.timeEfficiency,
                        timePenalty: timingScore.timePenalty
                    });

                    // Update session metrics
                    session.metrics = {
                        readinessScore: timingScore.finalScore,
                        readinessStatus: aiResponse.data.readiness_status || 'Not Ready',
                        identifiedWeakAreas: aiResponse.data.weak_areas || [],
                        communicationScore: Math.max(0, Math.min(100, (aiResponse.data.clarity || 5) * 10)),
                        technicalScore: Math.max(0, Math.min(100, (aiResponse.data.technical_depth || 5) * 10)),
                        confidenceScore: aiResponse.data.confidence_score || 50,
                        recommendations: [timingScore.timingReason]
                    };

                    // Store speech analysis (Phase 5)
                    if (aiResponse.data.speech_analysis) {
                        session.speechAnalysis = aiResponse.data.speech_analysis;
                    }
                    if (Array.isArray(aiResponse.data.speech_tips)) {
                        session.speechTips = aiResponse.data.speech_tips;
                    }

                    // Update progress tracking (Phase 4)
                    if (aiResponse.data.progress) {
                        session.progressTracking = aiResponse.data.progress;
                    }

                    // Store asked question and its difficulty snapshot
                    if (question) {
                        session.questions.push({
                            _id: new mongoose.Types.ObjectId(),
                            text: question,
                            section: aiResponse.data.question_section || 'general',
                            difficulty: previousDifficulty,
                            questionNumber: (session.questions?.length || 0) + 1
                        });
                    }

                    // Adaptive difficulty transition persistence
                    if (!session.adaptiveDifficulty) {
                        session.adaptiveDifficulty = { currentLevel: 'medium', transitions: [] };
                    }
                    session.adaptiveDifficulty.currentLevel = transition.next;
                    session.adaptiveDifficulty.transitions.push({
                        from: previousDifficulty,
                        to: transition.next,
                        answerScore,
                        confidenceScore,
                        reason: transition.reason
                    });

                    // Generate next question by adaptive difficulty from MongoDB question bank
                    try {
                        const askedQuestionIds = (session.questions || [])
                            .map((q) => q.questionRef)
                            .filter(Boolean);
                        const nextQuestionDoc = await _pickNextQuestion({
                            role,
                            difficulty: transition.next,
                            excludeIds: askedQuestionIds
                        });
                        if (nextQuestionDoc?.title || nextQuestionDoc?.description) {
                            selectedNextQuestion = nextQuestionDoc.description || nextQuestionDoc.title;
                            adaptiveMeta.questionSource = 'question-bank';
                        }
                    } catch (pickErr) {
                        console.warn('Adaptive question pick warning:', pickErr.message);
                    }

                    adaptiveMeta = {
                        previousDifficulty,
                        nextDifficulty: transition.next,
                        transitionReason: transition.reason,
                        questionSource: adaptiveMeta.questionSource
                    };

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
            detailed_scores: aiResponse.data.detailed_scores,
            
            // Phase 3: Classification
            readiness_status: aiResponse.data.readiness_status,
            readiness_score: timingScore.finalScore,
            weak_areas: aiResponse.data.weak_areas,
            strong_areas: aiResponse.data.strong_areas,
            
            // Phase 4: Progress
            progress: aiResponse.data.progress,
            
            // Phase 5: Speech Analysis
            speech_analysis: aiResponse.data.speech_analysis,
            speech_tips: aiResponse.data.speech_tips || [],
            
            // UI Display
            next_question: selectedNextQuestion,
            feedback: aiResponse.data.feedback,
            rating: timingScore.finalScore,
            confidence_score: aiResponse.data.confidence_score,
            fillers_detected: aiResponse.data.fillers_detected,
            status_label: aiResponse.data.status_label,
            tutor_feedback: aiResponse.data.tutor_feedback,
            time_taken: Number(timeTaken || 0),
            allotted_time: Number(allottedTime || 75),
            time_efficiency: timingScore.timeEfficiency,
            time_penalty: timingScore.timePenalty,
            timing_feedback: timingScore.timingReason,
            company_mode: aiResponse.data.company_mode || normalizedCompanyMode,
            company_weighted_score: aiResponse.data.company_weighted_score || timingScore.finalScore,
            question_section: aiResponse.data.question_section || 'general',
            question_difficulty: aiResponse.data.question_difficulty || adaptiveMeta.nextDifficulty,

            // Adaptive difficulty metadata
            adaptive_difficulty: adaptiveMeta
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

/** Structured JSON report (same payload used for PDF). */
exports.getInterviewReportJson = async (req, res) => {
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
        if (session.user.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const payload = buildInterviewReportPayload(session);
        return res.json({ report: payload });
    } catch (err) {
        console.error('Interview report JSON Error:', err.message);
        return res.status(500).json({ message: 'Failed to build report', error: err.message });
    }
};

/** PDF download — Content-Disposition: attachment */
exports.getInterviewReportPdf = async (req, res) => {
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
        if (session.user.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const payload = buildInterviewReportPayload(session);
        const pdfBuffer = await renderInterviewReportPdf(payload);
        const safeName = `interview-report-${String(sessionId).replace(/[^a-zA-Z0-9-_]/g, '')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
        return res.send(pdfBuffer);
    } catch (err) {
        console.error('Interview report PDF Error:', err.message);
        return res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
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

exports.getProgressDashboard = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const roleFilter = req.query.role ? { role: req.query.role } : {};
        const companyModeFilter = req.query.companyMode ? { companyMode: req.query.companyMode } : {};
        const baseMatch = {
            user: new mongoose.Types.ObjectId(userId),
            status: 'Completed',
            ...roleFilter,
            ...companyModeFilter
        };

        // 1) Score trend over time (daily averages)
        const scoreTrend = await InterviewSession.aggregate([
            { $match: baseMatch },
            {
                $group: {
                    _id: {
                        day: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                        }
                    },
                    avgScore: { $avg: '$metrics.readinessScore' },
                    sessions: { $sum: 1 }
                }
            },
            { $sort: { '_id.day': 1 } }
        ]);

        // 2) Confidence improvement trend (daily averages)
        const confidenceTrend = await InterviewSession.aggregate([
            { $match: baseMatch },
            {
                $group: {
                    _id: {
                        day: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                        }
                    },
                    avgConfidence: { $avg: '$metrics.confidenceScore' },
                    sessions: { $sum: 1 }
                }
            },
            { $sort: { '_id.day': 1 } }
        ]);

        // 3) Topic-wise performance via question section + session score
        const topicPerformance = await InterviewSession.aggregate([
            { $match: baseMatch },
            { $unwind: { path: '$questions', preserveNullAndEmptyArrays: false } },
            {
                $group: {
                    _id: { section: { $ifNull: ['$questions.section', 'general'] } },
                    attempts: { $sum: 1 },
                    avgScore: { $avg: '$metrics.readinessScore' }
                }
            },
            { $sort: { attempts: -1 } }
        ]);

        const trendSeries = scoreTrend.map((item) => ({
            date: item._id.day,
            score: Math.round(item.avgScore || 0),
            sessions: item.sessions
        }));
        const confidenceSeries = confidenceTrend.map((item) => ({
            date: item._id.day,
            confidence: Math.round(item.avgConfidence || 0),
            sessions: item.sessions
        }));
        const topicSeries = topicPerformance.map((item) => ({
            topic: item._id.section,
            avgScore: Math.round(item.avgScore || 0),
            attempts: item.attempts
        }));

        // Estimated readiness date (simple projection from recent trend)
        let estimatedReadyDate = null;
        let currentScore = trendSeries.length ? trendSeries[trendSeries.length - 1].score : 0;
        if (trendSeries.length >= 2) {
            const recent = trendSeries.slice(-5);
            const first = recent[0].score;
            const last = recent[recent.length - 1].score;
            const delta = last - first;
            const steps = Math.max(1, recent.length - 1);
            const growthPerSession = delta / steps;
            if (growthPerSession > 0 && last < 75) {
                const sessionsNeeded = Math.ceil((75 - last) / growthPerSession);
                const readyDate = new Date();
                readyDate.setDate(readyDate.getDate() + sessionsNeeded * 2); // assume ~2 days between sessions
                estimatedReadyDate = readyDate.toISOString().slice(0, 10);
            } else if (last >= 75) {
                estimatedReadyDate = 'Ready now';
            }
        }

        return res.json({
            summary: {
                totalSessions: trendSeries.reduce((acc, d) => acc + (d.sessions || 0), 0),
                currentScore,
                estimatedReadinessDate: estimatedReadyDate || 'Need more sessions'
            },
            scoreTrend: trendSeries,
            confidenceTrend: confidenceSeries,
            topicPerformance: topicSeries
        });
    } catch (err) {
        console.error('Get Progress Dashboard Error:', err.message);
        return res.status(500).json({ message: 'Failed to retrieve analytics dashboard', error: err.message });
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
