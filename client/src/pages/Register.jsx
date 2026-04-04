import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Zap, Mail, Lock, User } from 'lucide-react'
import './Auth.css'

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await register(formData);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || err.response?.data?.message || 'Registration failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const strength = formData.password.length === 0 ? 0
        : formData.password.length < 6 ? 1
            : formData.password.length < 10 ? 2
                : 3;

    const strengthLabels = ['', 'Weak', 'Good', 'Strong'];
    const strengthColors = ['', '#ff5f56', '#ffbd2e', '#27c93f'];

    return (
        <div className="auth-container">
            <div className="auth-background">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="auth-grid" />
            </div>

            <motion.div
                className="auth-card glass-card"
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="auth-brand">
                    <Zap size={20} className="auth-brand-icon" />
                    <span>CareerQuest</span>
                </div>

                <div className="auth-header">
                    <h2>Create Account</h2>
                    <p>Join 50,000+ students on CareerQuest</p>
                </div>

                {error && (
                    <motion.div
                        className="auth-error"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        ⚠️ {error}
                    </motion.div>
                )}

                <form className="auth-form" onSubmit={onSubmit}>
                    <div className="input-group">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                            <User size={16} className="input-icon" />
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={onChange}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={16} className="input-icon" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={onChange}
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={16} className="input-icon" />
                            <input
                                type={showPwd ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={onChange}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                className="pwd-toggle"
                                onClick={() => setShowPwd(!showPwd)}
                                tabIndex={-1}
                            >
                                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {formData.password && (
                            <div className="pwd-strength">
                                <div className="strength-bars">
                                    {[1, 2, 3].map(l => (
                                        <div
                                            key={l}
                                            className="strength-bar"
                                            style={{ background: l <= strength ? strengthColors[strength] : 'var(--glass-border)' }}
                                        />
                                    ))}
                                </div>
                                <span style={{ color: strengthColors[strength], fontSize: '0.75rem', fontWeight: 600 }}>
                                    {strengthLabels[strength]}
                                </span>
                            </div>
                        )}
                    </div>

                    <button type="submit" className="primary-cta auth-btn" disabled={loading}>
                        {loading ? <><span className="spinner" /> Creating account...</> : 'Create Account →'}
                    </button>
                </form>

                <p className="auth-terms">
                    By registering, you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
                </p>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Login here</Link></p>
                </div>
            </motion.div>
        </div>
    )
}

export default Register
