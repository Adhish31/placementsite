const mongoose = require('mongoose');

/**
 * InterviewSession Model
 * Tracks a complete mock interview with all AI metrics and feedback
 * Enables Phase 3 & 4: ML Prediction and Personalization Engine
 */

const InterviewSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Session Metadata
    role: {
        type: String,
        required: true, // e.g., "Frontend Developer", "Data Scientist"
        enum: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer']
    },
    companyMode: {
        type: String,
        enum: ['general', 'amazon', 'google', 'tcs'],
        default: 'general'
    },
    
    domain: String, // e.g., "Web Development", "Machine Learning"
    
    startTime: {
        type: Date,
        default: Date.now
    },
    
    endTime: Date,
    
    duration: Number, // in seconds
    
    // ── PHASE 1: Basic AI Collection ──
    
    questions: [{
        _id: mongoose.Schema.Types.ObjectId,
        questionRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        text: String,
        section: { type: String, default: 'general' },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        },
        questionNumber: Number,
        timestamp: { type: Date, default: Date.now }
    }],
    
    answers: [{
        questionId: mongoose.Schema.Types.ObjectId,
        audioUrl: String,
        transcription: String,
        fillerCount: Number, // Detected "um", "uh", etc.
        duration: Number, // in seconds
        timeTaken: Number, // seconds spent answering
        allottedTime: Number, // allowed seconds for this question
        autoSubmitted: { type: Boolean, default: false },
        pauseMetrics: {
            totalPauses: Number,
            averagePauseDuration: Number,
            pauseCount: Number
        },
        timestamp: { type: Date, default: Date.now }
    }],
    
    // ── PHASE 2: NLP Analysis ──
    // Individual answer scores
    answerScores: [{
        questionId: mongoose.Schema.Types.ObjectId,
        // Clarity: 0-10 (grammar, eloquence, coherence)
        clarity: { type: Number, min: 0, max: 10 },
        // Relevance: 0-10 (how well answer addresses the question)
        relevance: { type: Number, min: 0, max: 10 },
        // Technical Depth: 0-10 (knowledge demonstration)
        technicalDepth: { type: Number, min: 0, max: 10 },
        // Keywords matched from job description
        keywordsMatched: [String],
        // Weak areas identified
        weakAreas: [String],
        // AI feedback for this answer
        feedback: String,
        detailedRubric: {
            clarity: { type: Number, min: 0, max: 100 },
            relevance: { type: Number, min: 0, max: 100 },
            depth: { type: Number, min: 0, max: 100 },
            confidence: { type: Number, min: 0, max: 100 },
            structure: { type: Number, min: 0, max: 100 }
        },
        tutorFeedback: {
            idealAnswer: String,
            comparison: String,
            missingConcepts: [String],
            weakAreas: [String],
            whatYouDidWell: [String],
            whatYouMissed: [String],
            howToImprove: [String]
        },
        timeEfficiency: { type: Number, min: 0, max: 100 },
        timePenalty: { type: Number, min: 0, max: 100, default: 0 },
        timestamp: { type: Date, default: Date.now }
    }],
    
    // ── PHASE 3: ML Classification & Prediction ──
    
    // Overall Session Metrics
    metrics: {
        // Readiness Score: 0-100 (average of all answer scores)
        readinessScore: { type: Number, min: 0, max: 100 },
        
        // Classification: "Ready" or "Not Ready" for interview
        readinessStatus: {
            type: String,
            enum: ['Ready', 'Not Ready', 'In Progress'],
            default: 'Not Ready'
        },
        
        // Identified weak areas across interview
        identifiedWeakAreas: [String],
        
        // Recommendations for improvement
        recommendations: [String],
        
        // Overall communication score
        communicationScore: { type: Number, min: 0, max: 100 },
        
        // Technical score
        technicalScore: { type: Number, min: 0, max: 100 },
        
        // Confidence score based on voice analysis and content
        confidenceScore: { type: Number, min: 0, max: 100 }
    },
    
    // ── PHASE 4: Time-based Tracking (LSTM) ──
    
    progressTracking: {
        // Trend of readiness over multiple interviews
        improvementTrend: {
            type: String,
            enum: ['Improving', 'Stable', 'Declining'],
            default: 'Stable'
        },
        
        // Rate of improvement (percentage)
        improvementRate: { type: Number, default: 0 },
        
        // Comparison with previous session (percentage change)
        comparisonWithPrevious: { type: Number, default: 0 },
        
        // Areas showing improvement
        improvementAreas: [String],
        
        // Areas still weak
        consistentWeakAreas: [String],
        
        // Estimated readiness date (when user will be "Ready")
        estimatedReadyDate: Date
    },
    
    // ── PHASE 5: Speech Analysis ──
    
    speechAnalysis: {
        // Tone detection
        tone: {
            type: String,
            enum: ['Confident', 'Nervous', 'Neutral', 'Hesitant'],
            default: 'Neutral'
        },
        
        // Speech rate (words per minute)
        speechRate: Number,
        
        // Total filler words
        fillerWords: Number,
        
        // Pause analysis
        pauseAnalysis: {
            totalPauses: Number,
            averagePauseDuration: Number, // in seconds
            pausesPerMinute: Number
        },
        
        // Energy level (based on speech patterns)
        energyLevel: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            default: 'Medium'
        },
        
        // Speech clarity score (0-100)
        clarityScore: { type: Number, min: 0, max: 100 }
    },
    speechTips: [String],
    
    // Feedback & Recommendations
    feedback: {
        overallFeedback: String,
        positivePoints: [String],
        areasForImprovement: [String],
        sessionSummary: String
    },

    // Adaptive difficulty engine state
    adaptiveDifficulty: {
        currentLevel: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        },
        transitions: [{
            from: { type: String, enum: ['easy', 'medium', 'hard'] },
            to: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
            answerScore: { type: Number, min: 0, max: 100, default: 0 },
            confidenceScore: { type: Number, min: 0, max: 100, default: 0 },
            reason: { type: String, default: '' },
            at: { type: Date, default: Date.now }
        }]
    },
    
    // Status
    status: {
        type: String,
        enum: ['In Progress', 'Completed', 'Abandoned'],
        default: 'In Progress'
    },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Index for faster queries
InterviewSessionSchema.index({ user: 1, createdAt: -1 });
InterviewSessionSchema.index({ user: 1, role: 1 });

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema);
