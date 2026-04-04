const mongoose = require('mongoose');

const DomainSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        default: '💼'
    },
    color: {
        type: String,
        default: '#3498db'
    },
    questionCount: {
        type: Number,
        default: 0
    },
    popularity: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Intermediate'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Domain', DomainSchema);
