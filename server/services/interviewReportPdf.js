const PDFDocument = require('pdfkit');

function _avg(nums) {
    const n = nums.filter((x) => typeof x === 'number' && !Number.isNaN(x));
    if (!n.length) return null;
    return Math.round(n.reduce((a, b) => a + b, 0) / n.length);
}

function _uniqStrings(arr) {
    const seen = new Set();
    const out = [];
    for (const s of arr || []) {
        const t = String(s || '').trim();
        if (!t || seen.has(t)) continue;
        seen.add(t);
        out.push(t);
    }
    return out;
}

function buildSevenDayPlan(strengths, weaknesses, metrics, speechTips) {
    const weak = _uniqStrings([
        ...(weaknesses || []),
        ...(metrics?.identifiedWeakAreas || []),
        ...(metrics?.recommendations || []).slice(0, 3)
    ]);
    const primary = weak[0] || 'core interview skills';
    const secondary = weak[1] || 'communication clarity';
    const tertiary = weak[2] || 'time management';

    const days = [
        {
            day: 1,
            theme: 'Baseline review',
            tasks: [
                `List 3 gaps related to: ${primary}.`,
                'Re-watch or re-read your last two answers and note missing structure.',
                'Set a target score +1 week out (e.g. +8 points).'
            ]
        },
        {
            day: 2,
            theme: 'Technical depth',
            tasks: [
                `Drill one concept tied to "${primary}" with 5 practice explanations out loud.`,
                'Write STAR outlines for 2 past project questions.',
                'Do 10 quick recall questions on your stack.'
            ]
        },
        {
            day: 3,
            theme: 'Structure & clarity',
            tasks: [
                'Practice 3 answers using Situation → Task → Action → Result.',
                `Focus improvements on: ${secondary}.`,
                'Record 2 minutes; trim filler words in one pass.'
            ]
        },
        {
            day: 4,
            theme: 'Company / role fit',
            tasks: [
                'Align 5 stories to role expectations and metrics.',
                'Prepare 3 questions you would ask the interviewer.',
                'Review one system design or coding pattern relevant to your role.'
            ]
        },
        {
            day: 5,
            theme: 'Timed mock block',
            tasks: [
                'Complete a 45-minute mock: easy → medium → hard.',
                'After each answer, write one sentence on what to improve next time.',
                `Target weak theme: ${tertiary}.`
            ]
        },
        {
            day: 6,
            theme: 'Voice & presence',
            tasks: [
                ...(speechTips && speechTips.length
                    ? [`Apply: ${speechTips[0]}`]
                    : ['Slow down key numbers; pause after each main point.']),
                'Practice 5 answers standing; aim for steady volume.',
                'Review filler-word hotspots from your session.'
            ]
        },
        {
            day: 7,
            theme: 'Consolidation',
            tasks: [
                'Redo your weakest question from this session from memory.',
                'Skim strengths list and add one new example for each.',
                'Schedule next mock to validate gains.'
            ]
        }
    ];

    return days;
}

/**
 * Maps a Mongoose InterviewSession document to the canonical report JSON.
 * @param {object} session Mongoose document or plain object
 */
function buildInterviewReportPayload(session) {
    const s = session.toObject ? session.toObject() : session;
    const metrics = s.metrics || {};
    const feedback = s.feedback || {};
    const speech = s.speechAnalysis || {};
    const answerScores = s.answerScores || [];

    const rubricVals = (key) =>
        answerScores
            .map((a) => a.detailedRubric && a.detailedRubric[key])
            .filter((x) => typeof x === 'number');

    const rubricAverages = {
        clarity: _avg(rubricVals('clarity')),
        relevance: _avg(rubricVals('relevance')),
        depth: _avg(rubricVals('depth')),
        confidence: _avg(rubricVals('confidence')),
        structure: _avg(rubricVals('structure'))
    };

    const tutorPos = _uniqStrings(
        answerScores.flatMap((a) => (a.tutorFeedback && a.tutorFeedback.whatYouDidWell) || [])
    );
    const tutorGap = _uniqStrings(
        answerScores.flatMap((a) => (a.tutorFeedback && a.tutorFeedback.whatYouMissed) || [])
    );

    const strengths = _uniqStrings([
        ...(feedback.positivePoints || []),
        ...tutorPos,
        ...(metrics.communicationScore >= 70 ? ['Solid communication signals'] : []),
        ...(metrics.technicalScore >= 70 ? ['Strong technical articulation'] : [])
    ]).slice(0, 12);

    const weaknesses = _uniqStrings([
        ...(feedback.areasForImprovement || []),
        ...tutorGap,
        ...(metrics.identifiedWeakAreas || []),
        ...(answerScores.flatMap((a) => a.weakAreas || [])),
        ...(answerScores.flatMap((a) => (a.tutorFeedback && a.tutorFeedback.weakAreas) || []))
    ]).slice(0, 12);

    const readinessScore =
        typeof metrics.readinessScore === 'number' ? metrics.readinessScore : null;
    const overallScore =
        readinessScore ??
        _avg([
            metrics.communicationScore,
            metrics.technicalScore,
            metrics.confidenceScore
        ].filter((x) => typeof x === 'number')) ??
        0;

    let summary = feedback.sessionSummary || feedback.overallFeedback || '';
    if (!summary && typeof overallScore === 'number') {
        summary =
            overallScore >= 75
                ? 'Strong session — keep pressure-testing edge cases.'
                : overallScore >= 55
                  ? 'Good foundation — prioritize depth and structure next.'
                  : 'Focus on fundamentals and timed practice.';
    }

    const payload = {
        meta: {
            title: 'Mock Interview — Final Report',
            sessionId: String(s._id),
            generatedAt: new Date().toISOString(),
            role: s.role || '',
            companyMode: s.companyMode || 'general',
            status: s.status || '',
            durationSeconds: typeof s.duration === 'number' ? s.duration : null
        },
        overall: {
            score: Math.max(0, Math.min(100, Math.round(overallScore))),
            readinessStatus: metrics.readinessStatus || 'In Progress',
            summary
        },
        strengths,
        weaknesses,
        detailedMetrics: {
            readinessScore:
                typeof metrics.readinessScore === 'number' ? metrics.readinessScore : null,
            communicationScore:
                typeof metrics.communicationScore === 'number'
                    ? metrics.communicationScore
                    : null,
            technicalScore:
                typeof metrics.technicalScore === 'number' ? metrics.technicalScore : null,
            confidenceScore:
                typeof metrics.confidenceScore === 'number' ? metrics.confidenceScore : null,
            rubricAverages,
            speech: {
                tone: speech.tone || null,
                speechRateWpm:
                    typeof speech.speechRate === 'number' ? speech.speechRate : null,
                fillerWords:
                    typeof speech.fillerWords === 'number' ? speech.fillerWords : null,
                pauseAnalysis: speech.pauseAnalysis || null,
                energyLevel: speech.energyLevel || null,
                clarityScore:
                    typeof speech.clarityScore === 'number' ? speech.clarityScore : null
            },
            questionsAnswered: answerScores.length,
            speechTips: _uniqStrings(s.speechTips || []).slice(0, 8)
        },
        improvementPlan: buildSevenDayPlan(
            strengths,
            weaknesses,
            metrics,
            s.speechTips || []
        )
    };

    return payload;
}

function _drawBullets(doc, items, x, startY, width, lineGap = 14) {
    let y = startY;
    const bullet = '•';
    for (const text of items || []) {
        doc.fontSize(10).text(`${bullet} ${text}`, x, y, { width, align: 'left' });
        y = doc.y + 4;
    }
    return y;
}

function _metricLine(label, value) {
    const v =
        value === null || value === undefined || Number.isNaN(value) ? '—' : String(value);
    return `${label}: ${v}`;
}

/**
 * Renders the report PDF into a Buffer.
 * @param {object} payload Report JSON from buildInterviewReportPayload
 * @returns {Promise<Buffer>}
 */
function renderInterviewReportPdf(payload) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50, info: {
            Title: payload.meta.title,
            Author: 'Placement Site'
        } });

        const chunks = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('error', reject);
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        const { meta, overall, strengths, weaknesses, detailedMetrics, improvementPlan } =
            payload;

        doc.fontSize(20).fillColor('#1a1a2e').text(meta.title, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#555').text(`Session: ${meta.sessionId}`, {
            align: 'center'
        });
        doc.text(`Generated: ${meta.generatedAt}`, { align: 'center' });
        doc.text(
            `Role: ${meta.role || '—'}  |  Mode: ${meta.companyMode}  |  Status: ${meta.status}`,
            { align: 'center' }
        );
        if (meta.durationSeconds != null) {
            doc.text(`Duration: ${meta.durationSeconds}s`, { align: 'center' });
        }

        doc.moveDown(1.2);
        doc.fontSize(14).fillColor('#16213e').text('Overall score');
        doc.moveDown(0.3);
        doc.fontSize(36).fillColor('#0f3460').text(String(overall.score));
        doc.fontSize(11).fillColor('#333').text(overall.readinessStatus);
        doc.moveDown(0.6);
        doc.fontSize(10).text(overall.summary || '', { width: 495, align: 'left' });

        doc.moveDown(1);
        doc.fontSize(14).fillColor('#16213e').text('Strengths');
        let y = doc.y + 6;
        y = _drawBullets(doc, strengths.length ? strengths : ['—'], 50, y, 495);
        doc.y = y;

        doc.moveDown(0.5);
        doc.fontSize(14).fillColor('#16213e').text('Weaknesses');
        y = doc.y + 6;
        y = _drawBullets(doc, weaknesses.length ? weaknesses : ['—'], 50, y, 495);
        doc.y = y;

        doc.addPage();
        doc.fontSize(14).fillColor('#16213e').text('Detailed metrics');
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#333');
        const m = detailedMetrics;
        doc.text(_metricLine('Readiness', m.readinessScore));
        doc.text(_metricLine('Communication', m.communicationScore));
        doc.text(_metricLine('Technical', m.technicalScore));
        doc.text(_metricLine('Confidence', m.confidenceScore));
        doc.moveDown(0.3);
        doc.fontSize(11).text('Rubric (session average, 0–100)');
        doc.fontSize(10);
        doc.text(_metricLine('Clarity', m.rubricAverages.clarity));
        doc.text(_metricLine('Relevance', m.rubricAverages.relevance));
        doc.text(_metricLine('Depth', m.rubricAverages.depth));
        doc.text(_metricLine('Confidence (rubric)', m.rubricAverages.confidence));
        doc.text(_metricLine('Structure', m.rubricAverages.structure));
        doc.moveDown(0.3);
        doc.fontSize(11).text('Speech');
        doc.fontSize(10);
        doc.text(_metricLine('Tone', m.speech.tone));
        doc.text(_metricLine('Speech rate (WPM)', m.speech.speechRateWpm));
        doc.text(_metricLine('Filler words (count)', m.speech.fillerWords));
        doc.text(_metricLine('Energy', m.speech.energyLevel));
        doc.text(_metricLine('Speech clarity score', m.speech.clarityScore));
        if (m.speech.pauseAnalysis && typeof m.speech.pauseAnalysis === 'object') {
            const p = m.speech.pauseAnalysis;
            doc.text(
                `Pauses: total ${p.totalPauses ?? '—'}, avg ${p.averagePauseDuration ?? '—'}s, per min ${p.pausesPerMinute ?? '—'}`
            );
        }
        doc.moveDown(0.3);
        doc.text(_metricLine('Questions scored', m.questionsAnswered));
        if (m.speechTips && m.speechTips.length) {
            doc.moveDown(0.3);
            doc.fontSize(11).text('Speech tips');
            doc.fontSize(10);
            y = doc.y + 4;
            y = _drawBullets(doc, m.speechTips, 50, y, 495);
            doc.y = y;
        }

        doc.addPage();
        doc.fontSize(14).fillColor('#16213e').text('7-day improvement plan');
        doc.moveDown(0.6);
        for (const day of improvementPlan) {
            doc.fontSize(12).fillColor('#0f3460').text(`Day ${day.day} — ${day.theme}`);
            doc.fontSize(10).fillColor('#333');
            y = doc.y + 4;
            y = _drawBullets(doc, day.tasks, 50, y, 495);
            doc.y = y + 8;
            if (doc.y > 720) {
                doc.addPage();
            }
        }

        doc.end();
    });
}

module.exports = {
    buildInterviewReportPayload,
    buildSevenDayPlan,
    renderInterviewReportPdf
};
