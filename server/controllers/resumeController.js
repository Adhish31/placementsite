const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync('uploads/')) {
            fs.mkdirSync('uploads/');
        }
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `resume-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /pdf|doc|docx/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) {
            return cb(null, true);
        }
        cb("Error: Only PDF/DOCX files!");
    }
}).single('resume');

// Analysis logic (Mock for now)
exports.analyzeResume = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).send(err);
        if (!req.file) return res.status(400).send("No file uploaded");

        const jobRole = req.body.jobRole || "Full Stack Developer";

        // Simulating the extraction and analysis
        // In reality, use pdf-parse and LLM
        setTimeout(() => {
            const results = {
                score: 75 + Math.floor(Math.random() * 20),
                keywords: ["React", "Node.js", "Express", "MongoDB", "REST API"],
                missingKeywords: ["Docker", "Kubernetes", "Redis"],
                strengths: [
                    "Clean layout and professional fonts.",
                    "Experience aligns with common tech stacks.",
                    "Active GitHub presence cited."
                ],
                improvements: [
                    "Use more power verbs.",
                    "Include quantifiable metrics (e.g., 'Speed increased by 40%').",
                    "A summary section would strengthen your profile."
                ]
            };
            res.json(results);
        }, 3000);
    });
};
