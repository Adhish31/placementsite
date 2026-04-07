const Question = require('../models/Question');
const Submission = require('../models/Submission');
const User = require('../models/User');
const mongoose = require('mongoose');

const EXP_TOPIC_HINTS = {
    fresher: ['fundamentals', 'basics', 'core concepts', 'syntax', 'oop', 'js basics', 'db basics'],
    '1-3': ['practical', 'scenario', 'real world', 'implementation', 'api', 'debugging', 'integration'],
    '3+': ['system design', 'architecture', 'scalability', 'optimization', 'performance', 'distributed systems']
};

function normalizeRole(role = '') {
    const r = String(role).toLowerCase().replace(/\s+/g, '');
    if (r === 'frontend') return 'frontend';
    if (r === 'backend') return 'backend';
    if (r === 'fullstack' || r === 'full-stack') return 'fullstack';
    return '';
}

function normalizeExp(exp = '') {
    const e = String(exp).toLowerCase().trim();
    if (e === 'fresher' || e === '0' || e === '0-1') return 'fresher';
    if (e === '1-3' || e === '1to3' || e === '1-3 yrs' || e === '1-3 years') return '1-3';
    if (e === '3+' || e === '3+ yrs' || e === '3+ years') return '3+';
    return '';
}

function normalizeDifficulty(difficulty = '') {
    const d = String(difficulty).toLowerCase().trim();
    if (['easy', 'medium', 'hard'].includes(d)) return d;
    return '';
}

// Get all questions
exports.getQuestions = async (req, res) => {
    try {
        const { role, exp, difficulty, topic } = req.query;

        const query = { isDailyChallenge: false };
        const normalizedRole = normalizeRole(role);
        const normalizedExp = normalizeExp(exp);
        const normalizedDifficulty = normalizeDifficulty(difficulty);

        if (normalizedRole) query.role = normalizedRole;
        if (normalizedExp) query.experienceLevel = normalizedExp;
        if (normalizedDifficulty) query.difficulty = normalizedDifficulty;
        if (topic) query.topic = new RegExp(`^${String(topic).trim()}$`, 'i');

        // Experience-aware topic bias:
        // fresher -> fundamentals, 1-3 -> practical/scenario, 3+ -> system design/optimization
        if (normalizedExp && !topic) {
            const hints = EXP_TOPIC_HINTS[normalizedExp] || [];
            if (hints.length > 0) {
                query.$or = hints.map((h) => ({ topic: new RegExp(h, 'i') }));
            }
        }

        let questions = await Question.find(query).sort({ createdAt: -1 });

        // Fallback: if strict topic-hint filter returns empty, retry without hint-only filtering.
        if (questions.length === 0 && query.$or) {
            const fallbackQuery = { ...query };
            delete fallbackQuery.$or;
            questions = await Question.find(fallbackQuery).sort({ createdAt: -1 });
        }

        res.json(questions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Get Daily Challenge
exports.getDailyChallenge = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let challenge = await Question.findOne({
            isDailyChallenge: true,
            challengeDate: { $gte: today }
        });

        if (!challenge) {
            // Pick a random question and make it the daily challenge if none exists
            const count = await Question.countDocuments();
            const random = Math.floor(Math.random() * count);
            const randomQuestion = await Question.findOne().skip(random);

            if (randomQuestion) {
                challenge = new Question({
                    ...randomQuestion.toObject(),
                    _id: mongoose.Types.ObjectId(),
                    isDailyChallenge: true,
                    challengeDate: today
                });
                await challenge.save();
            }
        }
        res.json(challenge);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Recommendation logic (simple version based on category)
exports.getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        const submissions = await Submission.find({ user: userId, status: 'Accepted' }).populate('question');

        const categories = submissions.map(s => s.question.category);
        const mostSolvedCategory = categories.sort((a, b) =>
            categories.filter(v => v === a).length - categories.filter(v => v === b).length
        ).pop();

        // Recommend from a different category or deeper in same category
        const recommendations = await Question.find({
            category: { $ne: mostSolvedCategory },
            _id: { $nin: submissions.map(s => s.question._id) }
        }).limit(3);

        res.json(recommendations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Admin: Add Question
exports.addQuestion = async (req, res) => {
    try {
        const newQuestion = new Question(req.body);
        const question = await newQuestion.save();
        res.json(question);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
