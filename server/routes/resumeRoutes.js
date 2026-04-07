const express = require('express');
const router = express.Router();
const { analyzeResume, getResumeHistory } = require('../controllers/resumeController');
const { auth } = require('../middleware/authMiddleware');

router.post('/analyze', auth, analyzeResume);
router.get('/history', auth, getResumeHistory);

module.exports = router;
