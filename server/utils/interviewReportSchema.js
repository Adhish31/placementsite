/**
 * Interview final report — structured JSON template (source of truth for PDF generation).
 *
 * @typedef {Object} InterviewReportMeta
 * @property {string} title
 * @property {string} sessionId
 * @property {string} generatedAt ISO-8601
 * @property {string} role
 * @property {string} companyMode
 * @property {string} status
 * @property {number|null} durationSeconds
 */

/**
 * @typedef {Object} InterviewReportOverall
 * @property {number} score 0–100
 * @property {string} readinessStatus
 * @property {string} summary One-line headline
 */

/**
 * @typedef {Object} InterviewReportDetailedMetrics
 * @property {number|null} readinessScore
 * @property {number|null} communicationScore
 * @property {number|null} technicalScore
 * @property {number|null} confidenceScore
 * @property {Object} rubricAverages
 * @property {number|null} rubricAverages.clarity
 * @property {number|null} rubricAverages.relevance
 * @property {number|null} rubricAverages.depth
 * @property {number|null} rubricAverages.confidence
 * @property {number|null} rubricAverages.structure
 * @property {Object} speech
 * @property {string|null} speech.tone
 * @property {number|null} speech.speechRateWpm
 * @property {number|null} speech.fillerWords
 * @property {Object|null} speech.pauseAnalysis
 * @property {string|null} speech.energyLevel
 * @property {number|null} speech.clarityScore
 * @property {number} questionsAnswered
 * @property {string[]} speechTips
 */

/**
 * @typedef {Object} InterviewReportDayPlan
 * @property {number} day 1–7
 * @property {string} theme
 * @property {string[]} tasks
 */

/**
 * @typedef {Object} InterviewReportPayload
 * @property {InterviewReportMeta} meta
 * @property {InterviewReportOverall} overall
 * @property {string[]} strengths
 * @property {string[]} weaknesses
 * @property {InterviewReportDetailedMetrics} detailedMetrics
 * @property {InterviewReportDayPlan[]} improvementPlan
 */

/** Example empty shape for clients / tests */
function emptyInterviewReportPayload() {
    return {
        meta: {
            title: 'Mock Interview — Final Report',
            sessionId: '',
            generatedAt: new Date().toISOString(),
            role: '',
            companyMode: 'general',
            status: '',
            durationSeconds: null
        },
        overall: {
            score: 0,
            readinessStatus: '',
            summary: ''
        },
        strengths: [],
        weaknesses: [],
        detailedMetrics: {
            readinessScore: null,
            communicationScore: null,
            technicalScore: null,
            confidenceScore: null,
            rubricAverages: {
                clarity: null,
                relevance: null,
                depth: null,
                confidence: null,
                structure: null
            },
            speech: {
                tone: null,
                speechRateWpm: null,
                fillerWords: null,
                pauseAnalysis: null,
                energyLevel: null,
                clarityScore: null
            },
            questionsAnswered: 0,
            speechTips: []
        },
        improvementPlan: []
    };
}

module.exports = {
    emptyInterviewReportPayload
};
