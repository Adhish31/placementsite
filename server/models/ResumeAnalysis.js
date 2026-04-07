const mongoose = require('mongoose');

const RecommendedJobSchema = new mongoose.Schema({
    title: { type: String, default: '' },
    matchScore: { type: Number, min: 0, max: 100, default: 0 },
    reason: { type: String, default: '' }
}, { _id: false });

const ResumeAnalysisSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    jobRole: { type: String, required: true, trim: true },
    originalFileName: { type: String, required: true },
    storedFilePath: { type: String, required: true },
    fileUrl: { type: String, required: true },
    resumeTextPreview: { type: String, default: '' },

    score: { type: Number, min: 0, max: 100, default: 0 },
    summary: { type: String, default: '' },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    keywords: [{ type: String }],
    missingKeywords: [{ type: String }],
    sectionFeedback: { type: Object, default: {} },

    extractedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    similarityScore: { type: Number, min: 0, max: 100, default: 0 },
    experienceLevel: { type: String, default: 'Entry Level' },
    recommendedJobs: [RecommendedJobSchema],
    improvementPlan: [{ type: String }]
}, {
    timestamps: true
});

module.exports = mongoose.model('ResumeAnalysis', ResumeAnalysisSchema);
