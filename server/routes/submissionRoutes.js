const express = require('express');
const router = express.Router();
const { submitCode, runCode } = require('../controllers/submissionController');
const { auth } = require('../middleware/authMiddleware');

router.post('/submit', auth, submitCode);
router.post('/run', auth, runCode);

module.exports = router;
