const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['frontend', 'backend', 'fullstack'],
        default: 'fullstack',
        lowercase: true,
        trim: true
    },
    experienceLevel: {
        type: String,
        enum: ['fresher', '1-3', '3+'],
        default: 'fresher',
        trim: true
    },
    topic: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String, // e.g., 'Array', 'String', 'DP'
        required: false
    },
    company: [{
        type: String // e.g., ['Google', 'Amazon']
    }],
    testCases: [{
        input: String,
        output: String,
        isVisible: { type: Boolean, default: true }
    }],
    solution: {
        type: String
    },
    isDailyChallenge: {
        type: Boolean,
        default: false
    },
    challengeDate: {
        type: Date // if it's a daily challenge
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Keep backward compatibility with legacy "category" based data.
QuestionSchema.pre('validate', function (next) {
    if (!this.topic && this.category) this.topic = this.category;
    if (!this.category && this.topic) this.category = this.topic;
    next();
});

module.exports = mongoose.model('Question', QuestionSchema);
