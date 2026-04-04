const express = require('express');
const router = express.Router();
const multer = require('multer');
const { startInterview, submitAnswer, health } = require('../controllers/interviewController');
const { auth } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });

// @route   POST api/interview/start
// @desc    Start an AI interview session
router.post('/start', auth, startInterview);

// @route   POST api/interview/submit
// @desc    Analyze voice answer and get next question
router.post('/submit', auth, upload.single('audio'), submitAnswer);

// @route   GET api/interview/health
// @desc    Check backend reachability to the Python ML service
router.get('/health', health);

module.exports = router;
