const mongoose = require('mongoose');

const InterviewQuestionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    question: {
        type: String,
        required: true
    },
    domain: {
        type: String,
        required: true // e.g., 'Web Development', 'DevOps', etc.
    },
    difficulty: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Intermediate'
    },
    answer: {
        type: String,
        required: true
    },
    keyPoints: [{
        type: String // Important points to mention in answer
    }],
    tags: [{
        type: String // Related topics/keywords
    }],
    companies: [{
        type: String // Companies that ask this question
    }],
    frequency: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    courseUrl: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('InterviewQuestion', InterviewQuestionSchema);
