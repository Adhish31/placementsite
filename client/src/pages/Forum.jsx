import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, Share2, Search, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import './Forum.css';

const Forum = () => {
    const posts = [
        { id: 1, user: "Karan_99", title: "Amazon SDE-1 Interview Experience 2026", tags: ["Interview", "Amazon"], likes: 124, comments: 45, time: "2h ago" },
        { id: 2, user: "DevGuru", title: "Best resources for System Design?", tags: ["Resources", "System Design"], likes: 89, comments: 12, time: "5h ago" },
        { id: 3, user: "PlacementCell", title: "Upcoming off-campus drive for Google", tags: ["Off-campus", "Jobs"], likes: 567, comments: 230, time: "1d ago" },
    ];

    return (
        <>
            <header className="dashboard-header forum-header">
                <div>
                    <h1>Discussion <span className="gradient-text">Forum</span></h1>
                    <p>Share experiences, ask questions, and grow with the community.</p>
                </div>
                <button className="primary-cta new-post-btn">
                    <Plus size={20} /> Start Discussion
                </button>
            </header>

            <div className="forum-filters glass-card">
                <div className="search-box">
                    <Search size={18} />
                    <input type="text" placeholder="Search discussions..." />
                </div>
                <div className="tags-row">
                    <span className="tag active">All</span>
                    <span className="tag">Interviews</span>
                    <span className="tag">DSA</span>
                    <span className="tag">Company Prep</span>
                    <span className="tag">Resume Tips</span>
                </div>
            </div>

            <div className="posts-list">
                {posts.map((post, i) => (
                    <motion.div
                        key={post.id}
                        className="post-card glass-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <div className="post-meta">
                            <div className="post-user-info">
                                <div className="u-avatar">{post.user[0]}</div>
                                <span className="u-name">{post.user}</span>
                                <span className="p-dot">•</span>
                                <span className="p-time">{post.time}</span>
                            </div>
                            <div className="post-tags">
                                {post.tags.map(t => <span key={t} className="p-tag">{t}</span>)}
                            </div>
                        </div>
                        <h3 className="post-title">{post.title}</h3>
                        <div className="post-actions">
                            <button className="pa-btn"><ThumbsUp size={16} /> {post.likes}</button>
                            <button className="pa-btn"><MessageSquare size={16} /> {post.comments} Comments</button>
                            <button className="pa-btn"><Share2 size={16} /></button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </>
    );
};

export default Forum;
