const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/leaderboardController');
const { auth } = require('../middleware/authMiddleware');

router.get('/', auth, getLeaderboard);

module.exports = router;
