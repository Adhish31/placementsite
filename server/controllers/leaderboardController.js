const User = require('../models/User');

// Get top 100 users by XP
exports.getLeaderboard = async (req, res) => {
    try {
        const leaders = await User.find({})
            .sort({ xp: -1 })
            .limit(100)
            .select('name xp dailyStreak');
        res.json(leaders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Update user XP (normally called internally by submission logic)
exports.updateUserXP = async (userId, xpAmount) => {
    try {
        const user = await User.findById(userId);
        user.xp += xpAmount;
        await user.save();
    } catch (err) {
        console.error(err.message);
    }
};
