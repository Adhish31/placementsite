const express = require('express');
const router = express.Router();
const { analyzeResume } = require('../controllers/resumeController');
const { auth } = require('../middleware/authMiddleware');

router.post('/analyze', auth, analyzeResume);

module.exports = router;
