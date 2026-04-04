import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Zap, Mail, Lock } from 'lucide-react'
import './Auth.css'

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(formData.email, formData.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

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
                    <h2>Welcome Back</h2>
                    <p>Login to continue your placement prep</p>
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
                        <div className="label-row">
                            <label>Password</label>
                            <a href="#" className="forgot-link">Forgot password?</a>
                        </div>
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
                    </div>

                    <button type="submit" className="primary-cta auth-btn" disabled={loading}>
                        {loading ? <><span className="spinner" /> Logging in...</> : 'Login →'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/register">Create one free</Link></p>
                </div>
            </motion.div>
        </div>
    )
}

export default Login
