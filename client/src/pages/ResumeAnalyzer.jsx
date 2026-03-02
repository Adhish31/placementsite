import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import {
    FileSearch, Sparkles, CheckCircle, AlertCircle,
    FileText, Zap, Target, Search, BarChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ResumeAnalyzer = () => {
    const [file, setFile] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState(null);
    const [jobRole, setJobRole] = useState("Full Stack Developer");

    const onDrop = async (acceptedFiles) => {
        const uploadedFile = acceptedFiles[0];
        setFile(uploadedFile);
        setAnalyzing(true);

        const formData = new FormData();
        formData.append('resume', uploadedFile);
        formData.append('jobRole', jobRole);

        try {
            const res = await axios.post('http://localhost:5000/api/resume/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResults(res.data);
        } catch (err) {
            console.error('Analysis error:', err);
            alert("Analysis failed. Try again.");
        } finally {
            setAnalyzing(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
    });

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content">
                <header className="dashboard-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                        <div>
                            <h1>AI Resume <span className="gradient-text">Intelligence</span></h1>
                            <p>Get data-driven feedback on how your resume performs against top tech roles.</p>
                        </div>
                        <div className="role-selector">
                            <span className="label">Targeting:</span>
                            <select value={jobRole} onChange={(e) => setJobRole(e.target.value)}>
                                <option>Full Stack Developer</option>
                                <option>Data Scientist</option>
                                <option>Frontend Engineer</option>
                                <option>Backend Architect</option>
                            </select>
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {!results && !analyzing ? (
                        <motion.div
                            key="dropzone"
                            {...getRootProps()}
                            className={`dropzone glass-card ${isDragActive ? 'active' : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <input {...getInputProps()} />
                            <div className="drop-circle">
                                <FileSearch size={40} className="drop-icon" />
                            </div>
                            <h3>{isDragActive ? "Drop IT!" : "Upload your resume"}</h3>
                            <p>Drag & drop or Click to browse</p>
                            <div className="format-badges">
                                <span>PDF</span><span>DOCX</span>
                            </div>
                        </motion.div>
                    ) : analyzing ? (
                        <motion.div
                            key="analyzing"
                            className="analyzing-state glass-card"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="ai-scanner">
                                <div className="scan-line"></div>
                                <FileText size={80} color="var(--primary)" />
                            </div>
                            <h3>Neural Keyword Scanning...</h3>
                            <p>Matching structure against 5,000+ successful resumes</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            className="analysis-dashboard"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="main-stat-row">
                                <div className="score-hero glass-card">
                                    <div className="circular-progress">
                                        <svg viewBox="0 0 36 36">
                                            <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                            <path className="circle" strokeDasharray={`${results.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        </svg>
                                        <span className="score-val">{results.score}</span>
                                    </div>
                                    <h3>Overall ATS Score</h3>
                                    <p>Based on {jobRole} requirements</p>
                                    <button className="re-upload-btn" onClick={() => setResults(null)}>New Analysis</button>
                                </div>

                                <div className="keywords-card glass-card">
                                    <div className="card-header">
                                        <Target className="icon purple" />
                                        <h3>Keyword Analysis</h3>
                                    </div>
                                    <div className="keyword-cloud">
                                        {results.keywords.map(k => <span key={k} className="keyword-tag match">{k}</span>)}
                                        {results.missingKeywords.map(k => <span key={k} className="keyword-tag missing">{k}</span>)}
                                    </div>
                                    <p className="keyword-insight"><Sparkles size={14} /> Add <b>{results.missingKeywords[0]}</b> to increase score by 8%</p>
                                </div>
                            </div>

                            <div className="critique-columns">
                                <div className="critique-section glass-card green-border">
                                    <div className="section-title"><CheckCircle size={18} /> Found Strengths</div>
                                    <ul>
                                        {results.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                                <div className="critique-section glass-card yellow-border">
                                    <div className="section-title"><Zap size={18} /> Critical Fixes</div>
                                    <ul>
                                        {results.improvements.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .role-selector { display: flex; align-items: center; gap: 1rem; background: var(--glass); padding: 0.5rem 1rem; border-radius: 12px; border: 1px solid var(--glass-border); }
                .role-selector .label { font-size: 0.8rem; color: var(--text-dim); text-transform: uppercase; }
                .role-selector select { background: none; border: none; color: white; outline: none; font-weight: 600; cursor: pointer; }
                
                .dropzone { height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; border: 2px dashed var(--glass-border); }
                .drop-circle { width: 100px; height: 100px; border-radius: 50%; background: var(--primary-glow); display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
                .format-badges { display: flex; gap: 0.5rem; margin-top: 1rem; }
                .format-badges span { font-size: 0.7rem; background: var(--glass); padding: 4px 12px; border-radius: 6px; border: 1px solid var(--glass-border); }
                
                .ai-scanner { position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; background: var(--glass); border-radius: 20px; overflow: hidden; margin-bottom: 2rem; }
                .scan-line { position: absolute; width: 100%; height: 2px; background: var(--primary); box-shadow: 0 0 15px var(--primary); top: 0; animation: scan 2s linear infinite; z-index: 2; }
                @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }

                .analysis-dashboard { display: flex; flex-direction: column; gap: 2rem; }
                .main-stat-row { display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; }
                .score-hero { padding: 3rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                .circular-progress { width: 160px; height: 160px; position: relative; }
                .circular-progress svg { width: 100%; height: 100%; }
                .score-val { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 2.5rem; font-weight: 800; }
                .circle-bg { fill: none; stroke: var(--glass); stroke-width: 3; }
                .circle { fill: none; stroke: var(--primary); stroke-width: 3; stroke-linecap: round; transition: 1s ease-out; }
                
                .keywords-card { padding: 2rem; }
                .keyword-cloud { display: flex; flex-wrap: wrap; gap: 0.8rem; margin: 2rem 0; }
                .keyword-tag { padding: 6px 16px; border-radius: 20px; font-size: 0.9rem; font-weight: 500; }
                .keyword-tag.match { background: rgba(39, 201, 63, 0.1); color: #27c93f; border: 1px solid rgba(39, 201, 63, 0.2); }
                .keyword-tag.missing { background: rgba(255, 95, 86, 0.1); color: #ff5f56; border: 1px solid rgba(255, 95, 86, 0.2); }
                .keyword-insight { font-size: 0.85rem; color: var(--text-dim); display: flex; align-items: center; gap: 8px; }

                .re-upload-btn { background: none; border: 1px solid var(--glass-border); color: var(--text-dim); padding: 8px 16px; border-radius: 8px; cursor: pointer; margin-top: 1rem; font-size: 0.85rem; }
                .re-upload-btn:hover { color: white; border-color: white; }

                .critique-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .critique-section { padding: 2rem; }
                .critique-section.green-border { border-top: 4px solid #27c93f; }
                .critique-section.yellow-border { border-top: 4px solid #ffbd2e; }
                .section-title { display: flex; align-items: center; gap: 10px; font-weight: 700; margin-bottom: 1.5rem; font-size: 1.1rem; }
                .critique-section ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 1rem; }
                .critique-section li { font-size: 0.95rem; color: var(--text-dim); position: relative; padding-left: 20px; line-height: 1.5; }
                .critique-section li::before { content: "→"; position: absolute; left: 0; color: var(--primary); }
            `}} />
        </div>
    );
};

export default ResumeAnalyzer;
