const express = require('express');
const router = express.Router();
const { getQuestions, getDailyChallenge, getRecommendations, addQuestion } = require('../controllers/questionController');
const { auth } = require('../middleware/authMiddleware');

router.get('/', auth, getQuestions);
router.get('/daily', auth, getDailyChallenge);
router.get('/recommendations', auth, getRecommendations);
router.post('/', auth, addQuestion); // ideally Admin check here

module.exports = router;
