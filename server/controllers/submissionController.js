const Submission = require('../models/Submission');
const User = require('../models/User');

const node_vm = require('vm');

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

        // Simulated output
        let output = "";

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
        } else {
            output = `Execution in ${language} is currently only supported in high-tier plans, yet we've simulated it for you! \n\nOutput: Hello, World!`;
        }

        res.json({ output });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
