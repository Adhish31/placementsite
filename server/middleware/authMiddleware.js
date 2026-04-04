const jwt = require('jsonwebtoken');

/**
 * auth — validates JWT in x-auth-token header
 * Attaches decoded payload to req.user = { id, role }
 */
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, role, iat, exp }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session expired. Please log in again.' });
        }
        return res.status(401).json({ message: 'Invalid token.' });
    }
};

/**
 * authorize(...roles)
 * Usage: router.delete('/user/:id', auth, authorize('admin'), handler)
 * Always chain AFTER auth so req.user is populated.
 */
const authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({
            message: `Role '${req.user.role}' is not authorized for this action.`
        });
    }
    next();
};

/**
 * requireEmailVerified
 * Block actions that require a confirmed email.
 * Usage: router.post('/test', auth, requireEmailVerified, handler)
 */
const requireEmailVerified = async (req, res, next) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.user.id).select('isEmailVerified');
        if (!user?.isEmailVerified) {
            return res.status(403).json({
                message: 'Please verify your email address before accessing this feature.'
            });
        }
        next();
    } catch {
        return res.status(500).json({ message: 'Server error during auth check.' });
    }
};

module.exports = { auth, authorize, requireEmailVerified };
