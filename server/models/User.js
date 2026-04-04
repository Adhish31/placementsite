const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [60, 'Name cannot exceed 60 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    xp: { type: Number, default: 0 },
    dailyStreak: { type: Number, default: 0 },
    lastChallengeDate: { type: Date },
    bookmarkedQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],

    // ── Email Verification ──────────────────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String },
    emailVerifyExpire: { type: Date },

    // ── Password Reset ──────────────────────────────────────────────────────
    passwordResetToken: { type: String },
    passwordResetExpire: { type: Date },

    createdAt: { type: Date, default: Date.now }
});

// ── Generate a secure random token (SHA-256 hashed for storage) ─────────────
// Returns the RAW (unhashed) token to send in the email link,
// and stores the HASHED version in the DB so DB leaks can't be used directly.
UserSchema.methods.generateVerifyToken = function () {
    const rawToken = crypto.randomBytes(32).toString('hex');
    this.emailVerifyToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    this.emailVerifyExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 h
    return rawToken; // send this in the email
};

UserSchema.methods.generatePasswordResetToken = function () {
    const rawToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    this.passwordResetExpire = Date.now() + 60 * 60 * 1000; // 1 h
    return rawToken;
};

module.exports = mongoose.model('User', UserSchema);
