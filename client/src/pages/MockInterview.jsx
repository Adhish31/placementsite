import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
    Mic, MicOff, Play, Send, Sparkles, 
    MessageSquare, Award, AlertCircle, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MockInterview = () => {
    // ── State ──
    const [role, setRole] = useState('Frontend Developer');
    const [companyMode, setCompanyMode] = useState('general');
    const [status, setStatus] = useState('idle'); // idle, starting, active, processing
    const [history, setHistory] = useState([]); // [{type: 'question', text: '...'}, {type: 'answer', text: '...'}, ...]
    const [feedback, setFeedback] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [timeLimit, setTimeLimit] = useState(75);
    const [timeLeft, setTimeLeft] = useState(75);
    const [isAutoSubmit, setIsAutoSubmit] = useState(false);
    
    // ── Refs (Audio context) ──
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const recordingStartedAt = useRef(null);
    const submitMetaRef = useRef({ timeTaken: 0, allottedTime: 75, autoSubmitted: false });

    const randomTimeLimit = () => 60 + Math.floor(Math.random() * 31); // 60-90

    useEffect(() => {
        if (status !== 'active' || !isRecording) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsAutoSubmit(true);
                    stopRecording(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [status, isRecording]);

    const startInterview = async () => {
        setStatus('starting');
        setHistory([]);
        setFeedback(null);
        const firstLimit = randomTimeLimit();
        setTimeLimit(firstLimit);
        setTimeLeft(firstLimit);
        
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/interview/start', { role, companyMode }, {
                headers: { 'x-auth-token': token || '' }
            });
            
            setHistory([{ type: 'question', text: res.data.question }]);
            setStatus('active');
        } catch (err) {
            console.error(err);
            alert("AI service unavailable. Make sure your Python ML service is running.");
            setStatus('idle');
        }
    };

    // ── Audio Recording Logic ──
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
            
            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
                submitAnswer(audioBlob, submitMetaRef.current);
            };

            mediaRecorder.current.start();
            recordingStartedAt.current = Date.now();
            setTimeLeft(timeLimit);
            setIsRecording(true);
        } catch (err) {
            alert("Microphone access denied.");
        }
    };

    const stopRecording = (autoSubmitted = false) => {
        if (mediaRecorder.current && isRecording) {
            const elapsed = recordingStartedAt.current
                ? Math.max(1, Math.round((Date.now() - recordingStartedAt.current) / 1000))
                : 0;
            submitMetaRef.current = {
                timeTaken: elapsed,
                allottedTime: timeLimit,
                autoSubmitted
            };
            mediaRecorder.current.stop();
            setIsRecording(false);
            setStatus('processing');
        }
    };

    const submitAnswer = async (audioBlob, submitMeta = { timeTaken: 0, allottedTime: 75, autoSubmitted: false }) => {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'answer.wav');
        formData.append('role', role);
        formData.append('companyMode', companyMode);
        formData.append('timeTaken', String(submitMeta.timeTaken || 0));
        formData.append('allottedTime', String(submitMeta.allottedTime || timeLimit));
        formData.append('autoSubmitted', String(!!submitMeta.autoSubmitted));
        
        // Convert history for the backend (excluding UI types)
        const chatHistory = history.map(h => ({
            [h.type]: h.text
        }));
        formData.append('history', JSON.stringify(chatHistory));

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/interview/submit', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'x-auth-token': token || '' 
                }
            });

            // Update UI
            setHistory(prev => [
                ...prev, 
                { type: 'answer', text: res.data.transcription },
                { type: 'question', text: res.data.next_question }
            ]);
            
            setFeedback({
                rating: res.data.rating,
                text: res.data.feedback,
                fillers: res.data.fillers_detected,
                confidence: res.data.confidence_score,
                companyWeightedScore: res.data.company_weighted_score,
                questionSection: res.data.question_section,
                timeTaken: res.data.time_taken,
                allottedTime: res.data.allotted_time,
                timeEfficiency: res.data.time_efficiency,
                timingFeedback: res.data.timing_feedback
            });
            const nextLimit = randomTimeLimit();
            setTimeLimit(nextLimit);
            setTimeLeft(nextLimit);
            setIsAutoSubmit(false);
            setStatus('active');
        } catch (err) {
            console.error(err);
            alert("Analysis failed. Try again.");
            const nextLimit = randomTimeLimit();
            setTimeLimit(nextLimit);
            setTimeLeft(nextLimit);
            setIsAutoSubmit(false);
            setStatus('active');
        }
    };

    return (
        <>
            <header className="dashboard-header">
                <div>
                    <h1>AI Smart <span className="gradient-text">Mock Interview</span></h1>
                    <p>Practice with your voice. Get real-time confidence and technical feedback.</p>
                </div>
            </header>

            <div className="interview-grid">
                {/* ── Control / Stats Panel ── */}
                <div className="interview-left">
                    <div className="glass-card status-card">
                        {status === 'idle' ? (
                            <div className="setup-view">
                                <h3>Configure Interview</h3>
                                <div className="form-group">
                                    <label>Target Role</label>
                                    <select value={role} onChange={(e) => setRole(e.target.value)}>
                                        <option>Frontend Developer</option>
                                        <option>Backend Developer</option>
                                        <option>Full Stack Developer</option>
                                        <option>Data Scientist</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Company Mode</label>
                                    <select value={companyMode} onChange={(e) => setCompanyMode(e.target.value)}>
                                        <option value="general">General</option>
                                        <option value="amazon">Amazon</option>
                                        <option value="google">Google</option>
                                        <option value="tcs">TCS</option>
                                    </select>
                                </div>
                                <div className="timer-preview">
                                    <div><b>Timed Answer Mode:</b> Enabled</div>
                                    <div>Per-question limit: <b>{timeLimit}s</b> (auto-random 60-90s)</div>
                                    <div>Auto-submit on timeout: <b>On</b></div>
                                </div>
                                <button className="primary-btn" onClick={startInterview}>
                                    <Play size={18} /> Start AI Session
                                </button>
                            </div>
                        ) : (
                            <div className="live-feedback-view">
                                <div className="session-tag">Live Session: <b>{role}</b></div>
                                <div className={`timer-chip ${timeLeft <= 10 ? 'danger' : timeLeft <= 20 ? 'warn' : ''}`}>
                                    Time Left: {timeLeft}s / {timeLimit}s
                                </div>
                                
                                {feedback && (
                                    <div className="results-panel">
                                        <div className="stat-row">
                                            <div className="stat-box">
                                                <span className="label">Confidence</span>
                                                <span className="value">{feedback.confidence}%</span>
                                            </div>
                                            <div className="stat-box">
                                                <span className="label">Fillers (um/ah)</span>
                                                <span className="value">{feedback.fillers}</span>
                                            </div>
                                        </div>
                                        <div className="stat-row">
                                            <div className="stat-box">
                                                <span className="label">Time Efficiency</span>
                                                <span className="value">{feedback.timeEfficiency}%</span>
                                            </div>
                                            <div className="stat-box">
                                                <span className="label">Time Taken</span>
                                                <span className="value">{feedback.timeTaken}s</span>
                                            </div>
                                        </div>
                                        <div className="stat-row">
                                            <div className="stat-box">
                                                <span className="label">Company Score</span>
                                                <span className="value">{feedback.companyWeightedScore ?? '--'}</span>
                                            </div>
                                            <div className="stat-box">
                                                <span className="label">Round Type</span>
                                                <span className="value" style={{ fontSize: '1rem', textTransform: 'capitalize' }}>
                                                    {feedback.questionSection?.replace('_', ' ') || 'general'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="feedback-text">
                                            <Sparkles size={16} /> {feedback.text}
                                        </div>
                                        {feedback.timingFeedback && (
                                            <div className="feedback-text" style={{ marginTop: '0.4rem' }}>
                                                <Sparkles size={16} /> {feedback.timingFeedback}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="controls">
                                    {!isRecording ? (
                                        <button 
                                            className={`mic-btn ${status === 'processing' ? 'disabled' : ''}`} 
                                            onClick={startRecording}
                                            disabled={status === 'processing'}
                                        >
                                            <Mic size={32} />
                                            <span>Click to Talk</span>
                                        </button>
                                    ) : (
                                        <button className="mic-btn active" onClick={() => stopRecording(false)}>
                                            <MicOff size={32} />
                                            <div className="pulse-ring"></div>
                                            <span>Stop & Analyze</span>
                                        </button>
                                    )}
                                    {status === 'processing' && <div className="processing-text">AI is transcribing...</div>}
                                    {isAutoSubmit && status === 'processing' && (
                                        <div className="processing-text">Time is up. Auto-submitting your answer...</div>
                                    )}
                                </div>
                                
                                <button className="reset-btn" onClick={() => setStatus('idle')}>
                                    <RefreshCw size={14} /> End Interview
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Chat Transcript ── */}
                <div className="interview-right">
                    <div className="glass-card transcript-stack">
                        <h3>Interview Transcript</h3>
                        <div className="chat-container">
                            {history.length === 0 && <div className="empty-chat">Start the interview to begin conversation...</div>}
                            {history.map((msg, i) => (
                                <div key={i} className={`chat-bubble ${msg.type}`}>
                                    <div className="bubble-icon">
                                        {msg.type === 'question' ? <MessageSquare size={14} /> : <Award size={14} />}
                                    </div>
                                    <div className="bubble-text">{msg.text}</div>
                                </div>
                            ))}
                            {status === 'processing' && (
                                <div className="chat-bubble question typing">
                                    <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .interview-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 2rem; margin-top: 1rem; }
                
                .status-card { padding: 2rem; min-height: 400px; display: flex; flex-direction: column; justify-content: center; text-align: center; }
                .setup-view { display: flex; flex-direction: column; gap: 1.5rem; }
                .form-group { text-align: left; }
                .form-group label { display: block; font-size: 0.8rem; color: var(--text-dim); margin-bottom: 0.5rem; }
                .form-group select { width: 100%; background: var(--glass); border: 1px solid var(--glass-border); padding: 0.8rem; color: white; border-radius: 10px; }
                .timer-preview { text-align: left; background: var(--glass); border: 1px solid var(--glass-border); padding: 0.9rem 1rem; border-radius: 10px; font-size: 0.85rem; color: var(--text-dim); line-height: 1.6; }
                
                .session-tag { background: var(--primary-glow-sm); color: var(--primary-light); padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; margin-bottom: 2rem; display: inline-block; }
                .timer-chip { margin: 0 auto 1rem; width: fit-content; padding: 8px 14px; border-radius: 10px; border: 1px solid var(--glass-border); background: var(--glass); color: #b6f5c0; font-weight: 700; font-size: 0.85rem; }
                .timer-chip.warn { color: #ffbd2e; }
                .timer-chip.danger { color: #ff5f56; box-shadow: 0 0 16px rgba(255,95,86,0.25); }
                
                .results-panel { margin-bottom: 2rem; animation: slideIn 0.3s ease; }
                .stat-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
                .stat-box { background: var(--glass); padding: 1rem; border-radius: 12px; border: 1px solid var(--glass-border); }
                .stat-box .label { font-size: 0.7rem; color: var(--text-dim); display: block; }
                .stat-box .value { font-size: 1.5rem; font-weight: 800; color: var(--primary-light); }
                .feedback-text { font-size: 0.9rem; color: var(--text-dim); font-style: italic; display: flex; gap: 8px; justify-content: center; }

                .controls { margin: 2rem 0; }
                .mic-btn { width: 120px; height: 120px; border-radius: 50%; background: var(--primary); border: none; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 0 30px var(--primary-glow); transition: 0.3s; position: relative; margin: 0 auto; }
                .mic-btn.active { background: #ff5f56; box-shadow: 0 0 30px rgba(255, 95, 86, 0.4); }
                .mic-btn.disabled { opacity: 0.5; cursor: not-allowed; filter: grayscale(1); }
                .mic-btn span { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
                
                .pulse-ring { position: absolute; border: 4px solid #ff5f56; border-radius: 50%; top: -5px; bottom: -5px; left: -5px; right: -5px; animation: pulse 1.5s infinite; opacity: 0.5; }
                @keyframes pulse { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.3); opacity: 0; } }
                
                .transcript-stack { padding: 1.5rem; height: 600px; display: flex; flex-direction: column; }
                .chat-container { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; padding-right: 10px; margin-top: 1rem; }
                .chat-bubble { max-width: 85%; padding: 1rem; border-radius: 16px; font-size: 0.95rem; line-height: 1.5; display: flex; gap: 12px; }
                .chat-bubble.question { align-self: flex-start; background: var(--glass); border: 1px solid var(--glass-border); border-bottom-left-radius: 4px; }
                .chat-bubble.answer { align-self: flex-end; background: var(--primary-glow-sm); border: 1px solid rgba(157, 78, 221, 0.2); border-bottom-right-radius: 4px; color: var(--text-main); }
                .bubble-icon { opacity: 0.5; flex-shrink: 0; margin-top: 4px; }
                
                .typing .dot { width: 6px; height: 6px; background: var(--text-dim); border-radius: 50%; opacity: 0.4; animation: blink 1.4s infinite; }
                .typing .dot:nth-child(2) { animation-delay: 0.2s; }
                .typing .dot:nth-child(3) { animation-delay: 0.4s; }
                @keyframes blink { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

                .processing-text { margin-top: 1rem; color: var(--primary-light); font-weight: 700; font-size: 0.8rem; }
                .reset-btn { margin-top: auto; background: none; border: 1px solid var(--glass-border); color: var(--text-dim); padding: 8px 16px; border-radius: 8px; font-size: 0.8rem; cursor: pointer; }
            `}} />
        </>
    );
};

export default MockInterview;
