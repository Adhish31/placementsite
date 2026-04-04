import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, BookOpen, ClipboardList, HelpCircle, Lightbulb,
    CheckCircle2, ChevronRight, Download
} from 'lucide-react';
import './CompanyDetail.css';

const CompanyDetail = () => {
    const { name } = useParams();
    const navigate = useNavigate();

    // Mock data for companies
    const companyData = {
        Google: {
            color: '#4285F4',
            pattern: [
                { round: "Round 1: Online Coding", details: "2-3 complex DSA problems (90 mins)" },
                { round: "Round 2-4: Technical Interviews", details: "Focus on Algorithms, Data Structures and System Design" },
                { round: "Round 5: Googliness (HR)", details: "Behavioral and cultural fitment" }
            ],
            syllabus: ["Graphs & Trees", "Dynamic Programming", "System Design", "Advanced Strings"],
            prevQuestions: [
                "Implement a custom Trie for autocomplete.",
                "Calculate the shortest path in a dynamic grid.",
                "Design a simplified version of Google Search indexing."
            ],
            tips: [
                "Focus on time and space complexity analysis.",
                "Be vocal about your thought process during interviews.",
                "Master Recursion and Backtracking."
            ]
        },
        Amazon: {
            color: '#FF9900',
            pattern: [
                { round: "Round 1: OA", details: "Coding + Leadership Principles Quiz" },
                { round: "Round 2: Technical (F2F)", details: "Bar Raiser + Coding" },
                { round: "Round 3: Leadership Assessment", details: "Star method based interview" }
            ],
            syllabus: ["Arrays & Hashing", "Linked Lists", "OOP Concepts", "Memory Management"],
            prevQuestions: [
                "Find the first non-repeating character in a stream.",
                "Trapping Rain Water problem.",
                "Most frequent words in a paragraph."
            ],
            tips: [
                "Memorize and apply Amazon's 16 Leadership Principles.",
                "Optimize your code for large input sizes.",
                "Prepare 'Star Method' answers for behavioral questions."
            ]
        },
        TCS: {
            color: '#004C99',
            pattern: [
                { round: "Round 1: NQT", details: "Aptitude, Verbal, Programming Logic, Coding" },
                { round: "Round 2: Technical Interview", details: "Basics of C/C++, Java, DBMS" },
                { round: "Round 3: Managerial/HR", details: "Project discussion and general HR" }
            ],
            syllabus: ["Aptitude & Reasoning", "C/C++/Java Basics", "SQL Queries", "Software Engineering"],
            prevQuestions: [
                "Explain ACID properties in DBMS.",
                "Check if a number is Palindrome without using string functions.",
                "What is the difference between Abstraction and Encapsulation?"
            ],
            tips: [
                "Master the basics of your project.",
                "Practice Quantitative Aptitude heavily.",
                "Improve communication skills for HR rounds."
            ]
        }
    };

    const data = companyData[name] || companyData['Google']; // Fallback

    return (
        <>
            <motion.button
                className="back-btn"
                onClick={() => navigate('/company-prep')}
                whileHover={{ x: -5 }}
            >
                <ArrowLeft size={20} /> Back to Companies
            </motion.button>

            <header className="company-header">
                <div className="company-branding">
                    <div className="company-logo-large" style={{ backgroundColor: data.color }}>
                        {name[0]}
                    </div>
                    <div>
                        <h1 className="gradient-text">{name} Preparation</h1>
                        <p>Everything you need to crack the {name} interview.</p>
                    </div>
                </div>
                <button className="primary-cta download-btn">
                    <Download size={18} /> Download PDF Guide
                </button>
            </header>

            <section className="detail-grid">
                {/* Exam Pattern */}
                <motion.div
                    className="detail-card glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="card-title">
                        <ClipboardList className="icon purple" />
                        <h3>Exam Pattern</h3>
                    </div>
                    <div className="pattern-list">
                        {data.pattern.map((item, i) => (
                            <div key={i} className="pattern-item">
                                <span className="round-name">{item.round}</span>
                                <p className="round-desc">{item.details}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Syllabus */}
                <motion.div
                    className="detail-card glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="card-title">
                        <BookOpen className="icon blue" />
                        <h3>Focus Syllabus</h3>
                    </div>
                    <ul className="syllabus-list">
                        {data.syllabus.map((item, i) => (
                            <li key={i}><CheckCircle2 size={16} /> {item}</li>
                        ))}
                    </ul>
                </motion.div>

                {/* Previous Questions */}
                <motion.div
                    className="detail-card glass-card span-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="card-title">
                        <HelpCircle className="icon yellow" />
                        <h3>Previous Questions</h3>
                    </div>
                    <div className="questions-grid">
                        {data.prevQuestions.map((q, i) => (
                            <div key={i} className="question-item glass-card">
                                <p>"{q}"</p>
                                <button className="view-sol">View Solution <ChevronRight size={14} /></button>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Prep Tips */}
                <motion.div
                    className="detail-card glass-card span-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="card-title">
                        <Lightbulb className="icon green" />
                        <h3>Pro Tips</h3>
                    </div>
                    <div className="tips-container">
                        {data.tips.map((tip, i) => (
                            <div key={i} className="tip-item">
                                <div className="tip-number">{i + 1}</div>
                                <p>{tip}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>
        </>
    );
};

export default CompanyDetail;
