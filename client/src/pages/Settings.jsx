import React from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette } from 'lucide-react';

const Settings = () => {
    return (
        <>
            <header className="dashboard-header">
                <h1>User <span className="gradient-text">Settings</span></h1>
                <p>Manage your account preferences and customize your experience.</p>
            </header>

            <div className="settings-grid">
                <div className="settings-card glass-card">
                    <div className="settings-header">
                        <User className="icon purple" />
                        <h3>Profile Settings</h3>
                    </div>
                    <div className="settings-form">
                        <div className="form-group">
                            <label>Display Name</label>
                            <input type="text" placeholder="Adhish" />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" placeholder="adhish31@example.com" disabled />
                        </div>
                        <button className="primary-cta">Update Profile</button>
                    </div>
                </div>

                <div className="settings-card glass-card">
                    <div className="settings-header">
                        <Bell className="icon blue" />
                        <h3>Notifications</h3>
                    </div>
                    <div className="settings-options">
                        <div className="option-item">
                            <span>Email Notifications</span>
                            <div className="toggle active"></div>
                        </div>
                        <div className="option-item">
                            <span>Mobile Push</span>
                            <div className="toggle"></div>
                        </div>
                    </div>
                </div>

                <div className="settings-card glass-card">
                    <div className="settings-header">
                        <Shield className="icon green" />
                        <h3>Privacy & Security</h3>
                    </div>
                    <button className="prep-btn mini">Change Password</button>
                    <button className="prep-btn mini outline">Enable 2FA</button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .settings-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 2rem;
                    margin-top: 2rem;
                }
                .settings-card {
                    padding: 2.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .settings-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .settings-header h3 {
                    font-size: 1.1rem;
                }
                .settings-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.8rem;
                }
                .form-group label {
                    font-size: 0.9rem;
                    color: var(--text-dim);
                }
                .form-group input {
                    background: var(--glass);
                    border: 1px solid var(--glass-border);
                    color: white;
                    padding: 0.8rem 1rem;
                    border-radius: 10px;
                    outline: none;
                }
                .settings-options {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .option-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .option-item span {
                    font-size: 0.95rem;
                    color: var(--text-dim);
                }
                .toggle {
                    width: 40px;
                    height: 20px;
                    background: var(--glass-border);
                    border-radius: 10px;
                    position: relative;
                    cursor: pointer;
                }
                .toggle::after {
                    content: '';
                    position: absolute;
                    width: 14px;
                    height: 14px;
                    background: white;
                    border-radius: 50%;
                    top: 3px;
                    left: 3px;
                    transition: 0.3s;
                }
                .toggle.active {
                    background: var(--primary);
                }
                .toggle.active::after {
                    left: 23px;
                }
                .prep-btn.mini {
                    width: 100%;
                    margin-bottom: 0.5rem;
                }
                .prep-btn.mini.outline {
                    background: none;
                    border: 1px solid var(--glass-border);
                }
            `}} />
        </>
    );
};

export default Settings;
