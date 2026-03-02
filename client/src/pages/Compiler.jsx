import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Compiler = () => {
    const [code, setCode] = useState(`// Welcome to CareerQuest Compiler
// Practice your logic here

function solution(arr) {
    // Write your code here
    return arr.sort((a, b) => a - b);
}

console.log(solution([5, 2, 9, 1, 5, 6]));
`);
    const [output, setOutput] = useState("");
    const [language, setLanguage] = useState("javascript");

    const runCode = async () => {
        setOutput("Running...\n");
        try {
            const res = await axios.post('http://localhost:5000/api/submissions/run', {
                code,
                language
            });
            setOutput(res.data.output);
        } catch (err) {
            setOutput(`Error: ${err.response?.data?.message || 'Execution failed'}`);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-content full-height-compiler">
                <header className="compiler-header">
                    <div className="title-area">
                        <h1>Logic <span className="gradient-text">Compiler</span></h1>
                        <p>Solve challenges and test your snippets in real-time.</p>
                    </div>
                    <div className="compiler-actions">
                        <select
                            className="lang-select"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                        </select>
                        <button className="icon-btn" onClick={() => setCode("")}><RotateCcw size={18} /></button>
                        <button className="icon-btn"><Save size={18} /></button>
                        <button className="primary-cta run-btn" onClick={runCode}>
                            <Play size={18} fill="white" /> Run Code
                        </button>
                    </div>
                </header>

                <div className="editor-container glass-card">
                    <div className="editor-main">
                        <Editor
                            height="60vh"
                            language={language}
                            theme="vs-dark"
                            value={code}
                            onChange={(val) => setCode(val)}
                            options={{
                                fontSize: 16,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                borderRadius: 10,
                                automaticLayout: true,
                            }}
                        />
                    </div>
                    <div className="console-area">
                        <div className="console-header">
                            <span>Console Output</span>
                            <div className="status-dot green"></div>
                        </div>
                        <pre className="console-output">
                            {output || "Output will appear here after running your code..."}
                        </pre>
                    </div>
                </div>

                <div className="ai-recommendation glass-card">
                    <div className="ai-header">
                        <ShieldCheck className="ai-icon" />
                        <h3>AI Recommendation</h3>
                    </div>
                    <p>Based on your performance, you should practice <b>Dynamic Programming</b> problems next. Would you like to start a relevant challenge?</p>
                    <button className="prep-btn mini">Go to DP Problems</button>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .full-height-compiler {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .compiler-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .compiler-actions {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }
                .lang-select {
                    background: var(--glass);
                    border: 1px solid var(--glass-border);
                    color: white;
                    padding: 0.6rem 1rem;
                    border-radius: 10px;
                    outline: none;
                }
                .icon-btn {
                    background: var(--glass);
                    border: 1px solid var(--glass-border);
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .editor-container {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    padding: 1rem;
                    gap: 1rem;
                    overflow: hidden;
                }
                .editor-main {
                    border-radius: 10px;
                    overflow: hidden;
                    border: 1px solid var(--glass-border);
                }
                .console-area {
                    background: #1e1e1e;
                    border-radius: 10px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--glass-border);
                }
                .console-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.8rem;
                    color: var(--text-dim);
                    margin-bottom: 1rem;
                    text-transform: uppercase;
                }
                .status-dot { width: 8px; height: 8px; border-radius: 50%; }
                .status-dot.green { background: #27c93f; box-shadow: 0 0 10px #27c93f; }
                .console-output {
                    font-family: monospace;
                    font-size: 0.95rem;
                    color: #dcdcdc;
                    white-space: pre-wrap;
                }
                .ai-recommendation {
                    padding: 1.5rem 2rem;
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                }
                .ai-header { display: flex; align-items: center; gap: 0.8rem; min-width: 250px; }
                .ai-icon { color: var(--primary); }
                .ai-recommendation p { flex: 1; font-size: 0.95rem; color: var(--text-dim); }
                .prep-btn.mini { width: auto; padding: 0.6rem 1.5rem; font-size: 0.9rem; }
            `}} />
        </div>
    );
};

export default Compiler;
