const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const https = require('https');

// ── Multer setup ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync('uploads/')) fs.mkdirSync('uploads/', { recursive: true });
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `resume-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        const allowed = /pdf|doc|docx/;
        if (allowed.test(path.extname(file.originalname).toLowerCase())) return cb(null, true);
        cb(new Error('Only PDF / DOCX files are allowed!'));
    }
}).single('resume');

// ── Role-specific keyword maps ───────────────────────────────────────────────
const ROLE_KEYWORDS = {
    'Full Stack Developer': ['React', 'Node.js', 'Express', 'MongoDB', 'REST API', 'TypeScript', 'Docker', 'Git', 'PostgreSQL', 'GraphQL'],
    'Data Scientist': ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'SQL', 'Statistics', 'Jupyter', 'Scikit-learn'],
    'Frontend Engineer': ['React', 'Vue', 'Angular', 'CSS', 'TypeScript', 'Webpack', 'Vite', 'Accessibility', 'Responsive Design', 'Testing'],
    'Backend Architect': ['Microservices', 'Docker', 'Kubernetes', 'Redis', 'Kafka', 'PostgreSQL', 'gRPC', 'System Design', 'CI/CD', 'Cloud AWS/GCP']
};

// ── Gemini API helper ────────────────────────────────────────────────────────
function callGemini(prompt) {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return reject(new Error('GEMINI_API_KEY not set in .env'));

        const body = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (!text) return reject(new Error('Empty Gemini response'));
                    // Gemini returns JSON wrapped in markdown sometimes
                    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                    resolve(JSON.parse(cleaned));
                } catch (e) {
                    reject(new Error('Failed to parse Gemini JSON: ' + e.message));
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// ── Extract text from PDF ─────────────────────────────────────────────────────
async function extractText(filePath, ext) {
    if (ext === '.pdf') {
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        return data.text;
    }
    // For doc/docx just return a note — real docx parsing needs mammoth
    return fs.readFileSync(filePath, 'utf8').replace(/[^\x20-\x7E\n]/g, ' ');
}

// ── Main controller ──────────────────────────────────────────────────────────
exports.analyzeResume = (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ message: err.message || 'Upload error' });
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const jobRole = req.body.jobRole || 'Full Stack Developer';
        const filePath = req.file.path;
        const ext = path.extname(req.file.originalname).toLowerCase();
        const roleKeywords = ROLE_KEYWORDS[jobRole] || ROLE_KEYWORDS['Full Stack Developer'];

        try {
            // 1. Extract resume text
            const resumeText = await extractText(filePath, ext);

            if (!resumeText || resumeText.trim().length < 50) {
                return res.status(422).json({ message: 'Could not extract text from your resume. Please use a text-based PDF.' });
            }

            // 2. Build role-aware Gemini prompt
            const prompt = `
You are an expert ATS resume reviewer and career coach. Analyse the resume below for the target role: "${jobRole}".

RESUME TEXT:
"""
${resumeText.slice(0, 8000)}
"""

TARGET ROLE KEYWORDS TO CHECK: ${roleKeywords.join(', ')}

Return ONLY valid JSON (no markdown, no extra text) in this exact schema:
{
  "score": <integer 0-100, ATS compatibility score>,
  "summary": "<one sentence overall impression>",
  "keywords": [<array of strings – keywords FOUND in the resume relevant to the role>],
  "missingKeywords": [<array of strings – important keywords for ${jobRole} that are MISSING from the resume>],
  "strengths": [<array of 3-4 specific strengths observed in this resume>],
  "improvements": [<array of 3-5 specific, actionable improvements tailored to ${jobRole}>],
  "sectionFeedback": {
    "experience": "<brief feedback on experience section>",
    "skills": "<brief feedback on skills section>",
    "education": "<brief feedback on education section>",
    "formatting": "<brief feedback on formatting/readability>"
  }
}
`;

            // 3. Call Gemini
            const analysis = await callGemini(prompt);

            // 4. Cleanup uploaded file
            fs.unlink(filePath, () => {});

            return res.json(analysis);

        } catch (analysisErr) {
            console.error('Resume analysis error:', analysisErr.message);
            // Cleanup on error too
            fs.unlink(filePath, () => {});
            return res.status(500).json({
                message: 'AI analysis failed. Please try again.',
                detail: analysisErr.message
            });
        }
    });
};
