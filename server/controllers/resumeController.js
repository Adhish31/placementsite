const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParseImport = require('pdf-parse');
const pdfParse = typeof pdfParseImport === 'function'
    ? pdfParseImport
    : (pdfParseImport?.default && typeof pdfParseImport.default === 'function' ? pdfParseImport.default : null);
const https = require('https');
const axios = require('axios');
const ResumeAnalysis = require('../models/ResumeAnalysis');

const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');

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

function buildFallbackAnalysis(jobRole, roleKeywords, resumeText = '') {
    const text = (resumeText || '').toLowerCase();
    const found = roleKeywords.filter((k) => text.includes(k.toLowerCase()));
    const missing = roleKeywords.filter((k) => !text.includes(k.toLowerCase())).slice(0, 5);
    const score = Math.max(40, Math.min(85, 45 + found.length * 5));

    return {
        score,
        summary: `Basic analysis generated for ${jobRole}. AI enrichment is temporarily limited, but your resume was processed successfully.`,
        keywords: found,
        missingKeywords: missing,
        strengths: [
            'Resume uploaded and parsed successfully.',
            'Role-specific keyword matching completed.',
            'Baseline ATS scoring generated for quick guidance.'
        ],
        improvements: [
            `Add measurable achievements for ${jobRole} projects.`,
            'Use stronger action verbs and impact-focused bullet points.',
            `Include missing keywords: ${missing.join(', ') || 'role-specific stack terms'}.`
        ],
        sectionFeedback: {
            experience: 'Add quantified impact for each role.',
            skills: 'Group skills by category and prioritize role-relevant tools.',
            education: 'Keep concise and include relevant coursework/certifications.',
            formatting: 'Use clean headings and ATS-friendly single-column layout.'
        }
    };
}

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

        req.setTimeout(15000, () => {
            req.destroy(new Error('Gemini request timed out'));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// ── Extract text from PDF ─────────────────────────────────────────────────────
async function extractText(filePath, ext) {
    if (ext === '.pdf') {
        if (pdfParse) {
            try {
                const buffer = fs.readFileSync(filePath);
                const data = await pdfParse(buffer);
                return data.text || '';
            } catch {
                // Fall through to plain-text fallback below
            }
        }
        return fs.readFileSync(filePath, 'utf8').replace(/[^\x20-\x7E\n]/g, ' ');
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

            const safeResumeText = (resumeText || '').trim();

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
            let analysis = buildFallbackAnalysis(jobRole, roleKeywords, safeResumeText);
            if (safeResumeText.length >= 50) {
                try {
                    analysis = await callGemini(prompt);
                } catch (geminiErr) {
                    console.warn('Gemini unavailable, using fallback analysis:', geminiErr.message);
                }
            }

            // 4. ML model suggestions from Python service
            let mlAnalysis = {
                extracted_skills: [],
                missing_skills: [],
                similarity_score: 0,
                experience_level: 'Entry Level',
                recommended_jobs: [],
                improvement_plan: []
            };
            try {
                const mlRes = await axios.post(`${ML_SERVICE_URL}/resume-role-analysis`, {
                    resume_text: safeResumeText.slice(0, 20000),
                    role: jobRole
                }, { timeout: 25000 });
                mlAnalysis = mlRes.data || mlAnalysis;
            } catch (mlErr) {
                console.warn('ML service resume suggestion failed:', mlErr.message);
            }

            // 5. Persist uploaded file + analysis for user history
            const saved = await ResumeAnalysis.create({
                user: req.user.id,
                jobRole,
                originalFileName: req.file.originalname,
                storedFilePath: filePath,
                fileUrl: `/uploads/${path.basename(filePath)}`,
                resumeTextPreview: safeResumeText.slice(0, 500),
                score: analysis.score || 0,
                summary: analysis.summary || '',
                strengths: analysis.strengths || [],
                improvements: analysis.improvements || [],
                keywords: analysis.keywords || [],
                missingKeywords: analysis.missingKeywords || [],
                sectionFeedback: analysis.sectionFeedback || {},
                extractedSkills: mlAnalysis.extracted_skills || [],
                missingSkills: mlAnalysis.missing_skills || [],
                similarityScore: mlAnalysis.similarity_score || 0,
                experienceLevel: mlAnalysis.experience_level || 'Entry Level',
                recommendedJobs: (mlAnalysis.recommended_jobs || []).map((job) => ({
                    title: job.title || '',
                    matchScore: job.match_score || 0,
                    reason: job.reason || ''
                })),
                improvementPlan: mlAnalysis.improvement_plan || []
            });

            return res.json({
                ...analysis,
                analysisId: saved._id,
                fileUrl: saved.fileUrl,
                extractedSkills: mlAnalysis.extracted_skills || [],
                missingSkills: mlAnalysis.missing_skills || [],
                similarityScore: mlAnalysis.similarity_score || 0,
                experienceLevel: mlAnalysis.experience_level || 'Entry Level',
                recommendedJobs: (mlAnalysis.recommended_jobs || []).map((job) => ({
                    title: job.title || '',
                    matchScore: job.match_score || 0,
                    reason: job.reason || ''
                })),
                improvementPlan: mlAnalysis.improvement_plan || []
            });

        } catch (analysisErr) {
            console.error('Resume analysis error:', analysisErr.message);
            // Cleanup on error
            fs.unlink(filePath, () => {});
            return res.status(500).json({
                message: 'AI analysis failed. Please try again.',
                detail: analysisErr.message
            });
        }
    });
};

exports.getResumeHistory = async (req, res) => {
    try {
        const items = await ResumeAnalysis.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('jobRole originalFileName fileUrl score summary recommendedJobs createdAt');

        return res.json(items);
    } catch (err) {
        return res.status(500).json({ message: 'Could not fetch resume history.' });
    }
};
