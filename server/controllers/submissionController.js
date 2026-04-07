const Submission = require('../models/Submission');
const User = require('../models/User');

const node_vm = require('vm');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { ...options, shell: false });
        let stdout = '';
        let stderr = '';
        let timedOut = false;
        const timeoutMs = options.timeoutMs || 5000;

        const timer = setTimeout(() => {
            timedOut = true;
            child.kill();
        }, timeoutMs);

        child.stdout.on('data', (d) => {
            stdout += d.toString();
        });
        child.stderr.on('data', (d) => {
            stderr += d.toString();
        });
        child.on('error', (err) => {
            clearTimeout(timer);
            reject(err);
        });
        child.on('close', (code) => {
            clearTimeout(timer);
            if (timedOut) {
                return reject(new Error('Execution timed out.'));
            }
            resolve({ code, stdout, stderr });
        });
    });
}

async function runPython(code) {
    const result = await runCommand('python', ['-c', code], { timeoutMs: 7000 });
    return result.code === 0 ? result.stdout : (result.stderr || result.stdout);
}

async function runCpp(code) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cq-cpp-'));
    const src = path.join(dir, 'main.cpp');
    const exe = path.join(dir, process.platform === 'win32' ? 'main.exe' : 'main');
    fs.writeFileSync(src, code, 'utf8');

    try {
        const compile = await runCommand('g++', [src, '-std=c++17', '-O2', '-o', exe], { timeoutMs: 10000 });
        if (compile.code !== 0) return compile.stderr || compile.stdout;
        const run = await runCommand(exe, [], { cwd: dir, timeoutMs: 7000 });
        return run.code === 0 ? run.stdout : (run.stderr || run.stdout);
    } finally {
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    }
}

async function runJava(code) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cq-java-'));
    const src = path.join(dir, 'Main.java');
    fs.writeFileSync(src, code, 'utf8');

    try {
        const compile = await runCommand('javac', ['Main.java'], { cwd: dir, timeoutMs: 10000 });
        if (compile.code !== 0) return compile.stderr || compile.stdout;
        const run = await runCommand('java', ['-cp', dir, 'Main'], { cwd: dir, timeoutMs: 7000 });
        return run.code === 0 ? run.stdout : (run.stderr || run.stdout);
    } finally {
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    }
}

// Submit Code for Evaluation
exports.submitCode = async (req, res) => {
    try {
        const { questionId, code, language } = req.body;

        // Simulating the result for now
        // In a real env, you would run the code through a sandbox (like Judge0)

        const result = {
            status: 'Accepted', // or 'Wrong Answer'
            runtime: Math.floor(Math.random() * 100),
            memory: Math.floor(Math.random() * 20),
        };

        const newSubmission = new Submission({
            user: req.user.id,
            question: questionId,
            code,
            language,
            status: result.status,
            runtime: result.runtime,
            memory: result.memory
        });

        const submission = await newSubmission.save();

        if (result.status === 'Accepted') {
            // Give XP to the user
            const user = await User.findById(req.user.id);
            user.xp += 100; // default 100xp per successful submission
            await user.save();
        }

        res.json(submission);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// Execute Code (Mock for Editor)
exports.runCode = async (req, res) => {
    try {
        const { code, language } = req.body;
        if (!code || !language) {
            return res.status(400).json({ message: 'Code and language are required.' });
        }

        let output = '';

        if (language === 'javascript') {
            try {
                const logs = [];
                const sandbox = {
                    console: {
                        log: (...args) => logs.push(args.join(' '))
                    }
                };
                node_vm.createContext(sandbox);
                node_vm.runInContext(code, sandbox, { timeout: 1000 });
                output = logs.join('\n');
            } catch (err) {
                output = `Error: ${err.message}`;
            }
        } else if (language === 'python') {
            output = await runPython(code);
        } else if (language === 'cpp') {
            output = await runCpp(code);
        } else if (language === 'java') {
            output = await runJava(code);
        } else {
            return res.status(400).json({ message: `Unsupported language: ${language}` });
        }

        if (!output || output.trim().length === 0) {
            output = '[Program exited with no output]';
        }
        res.json({ output });
    } catch (err) {
        const msg = err?.message || 'Server error';
        if (msg.includes('ENOENT')) {
            return res.status(400).json({
                message: 'Selected language runtime/compiler is not installed on server.'
            });
        }
        console.error(msg);
        res.status(500).json({ message: msg });
    }
};
