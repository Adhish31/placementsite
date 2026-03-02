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
        enum: ['Easy', 'Medium', 'Hard'],
        required: true
    },
    category: {
        type: String, // e.g., 'Array', 'String', 'DP'
        required: true
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

module.exports = mongoose.model('Question', QuestionSchema);
