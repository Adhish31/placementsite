import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { MessageSquare, ThumbsUp, Share2, Search, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const Forum = () => {
    const posts = [
        { id: 1, user: "Karan_99", title: "Amazon SDE-1 Interview Experience 2026", tags: ["Interview", "Amazon"], likes: 124, comments: 45, time: "2h ago" },
        { id: 2, user: "DevGuru", title: "Best resources for System Design?", tags: ["Resources", "System Design"], likes: 89, comments: 12, time: "5h ago" },
        { id: 3, user: "PlacementCell", title: "Upcoming off-campus drive for Google", tags: ["Off-campus", "Jobs"], likes: 567, comments: 230, time: "1d ago" },
    ];

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content">
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
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .forum-header { display: flex; justify-content: space-between; align-items: center; }
                .new-post-btn { display: flex; align-items: center; gap: 8px; }
                
                .forum-filters { padding: 1.5rem; margin-bottom: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
                .search-box { display: flex; align-items: center; gap: 1rem; background: var(--glass); padding: 0.8rem 1.5rem; border-radius: 12px; border: 1px solid var(--glass-border); }
                .search-box input { background: none; border: none; color: white; width: 100%; outline: none; }
                
                .tags-row { display: flex; gap: 0.8rem; }
                .tag { padding: 0.4rem 1.2rem; border-radius: 20px; background: var(--glass); border: 1px solid var(--glass-border); font-size: 0.85rem; cursor: pointer; color: var(--text-dim); }
                .tag.active { background: var(--primary); color: white; border-color: var(--primary); }

                .posts-list { display: flex; flex-direction: column; gap: 1rem; }
                .post-card { padding: 2rem; transition: 0.3s; }
                .post-card:hover { border-color: var(--primary); transform: translateY(-3px); }
                
                .post-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; }
                .post-user-info { display: flex; align-items: center; gap: 0.8rem; }
                .u-avatar { width: 30px; height: 30px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; }
                .u-name { font-size: 0.9rem; font-weight: 600; }
                .p-time { font-size: 0.85rem; color: var(--text-dim); }
                .p-tag { font-size: 0.75rem; background: var(--primary-glow); color: var(--primary); padding: 2px 8px; border-radius: 4px; }
                
                .post-title { font-size: 1.2rem; margin-bottom: 1.5rem; line-height: 1.4; }
                .post-actions { display: flex; gap: 2rem; border-top: 1px solid var(--glass-border); padding-top: 1.2rem; }
                .pa-btn { background: none; border: none; color: var(--text-dim); display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer; transition: 0.3s; }
                .pa-btn:hover { color: var(--primary); }
            `}} />
        </div>
    );
};

export default Forum;
