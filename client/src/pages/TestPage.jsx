import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import './TestPage.css'

const TestPage = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds

    const questions = [
        {
            id: 1,
            text: "What is the time complexity of searching an element in a binary search tree in the worst case?",
            options: ["O(log n)", "O(n)", "O(n log n)", "O(1)"]
        },
        {
            id: 2,
            text: "Which of the following is not a pillar of OOP?",
            options: ["Inheritance", "Polymorphism", "Encapsulation", "Compilation"]
        },
        // More questions would go here
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="test-interface">
            <header className="test-header glass-card">
                <div className="test-info">
                    <h2>Google Mock Challenge #1</h2>
                    <span className="question-count">Question {currentQuestion + 1} of {questions.length}</span>
                </div>
                <div className={`test-timer ${timeLeft < 300 ? 'urgent' : ''}`}>
                    <Clock size={20} />
                    <span>{formatTime(timeLeft)}</span>
                </div>
                <button className="primary-cta submit-test-btn">Submit Test</button>
            </header>

            <main className="test-body">
                <div className="question-section">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={currentQuestion}
                            className="question-card glass-card"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <p className="question-text">{questions[currentQuestion].text}</p>
                            <div className="options-grid">
                                {questions[currentQuestion].options.map((option, i) => (
                                    <button key={i} className="option-btn">
                                        <span className="option-label">{String.fromCharCode(65 + i)}</span>
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <footer className="question-nav">
                        <button
                            className="nav-btn"
                            onClick={() => setCurrentQuestion(q => Math.max(0, q - 1))}
                            disabled={currentQuestion === 0}
                        >
                            <ChevronLeft size={20} /> Previous
                        </button>
                        <button className="nav-btn flag-btn"><Flag size={18} /> Mark for Review</button>
                        <button
                            className="nav-btn primary"
                            onClick={() => setCurrentQuestion(q => Math.min(questions.length - 1, q + 1))}
                            disabled={currentQuestion === questions.length - 1}
                        >
                            Next <ChevronRight size={20} />
                        </button>
                    </footer>
                </div>

                <aside className="question-palette glass-card">
                    <h3>Question Palette</h3>
                    <div className="palette-grid">
                        {questions.map((_, i) => (
                            <button
                                key={i}
                                className={`palette-item ${currentQuestion === i ? 'current' : ''}`}
                                onClick={() => setCurrentQuestion(i)}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <div className="palette-stats">
                        <div className="stat-item"><span className="dot green"></span> Answered</div>
                        <div className="stat-item"><span className="dot red"></span> Not Answered</div>
                        <div className="stat-item"><span className="dot yellow"></span> Marked</div>
                    </div>
                </aside>
            </main>
        </div>
    )
}

export default TestPage
