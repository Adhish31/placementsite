const Question = require('../models/Question');
const Submission = require('../models/Submission');
const User = require('../models/User');

// Get all questions
exports.getQuestions = async (req, res) => {
    try {
        const questions = await Question.find({ isDailyChallenge: false });
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
