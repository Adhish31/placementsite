# 🚀 Quick Start Guide - AI Smart Mock Interview

## Prerequisites
- Node.js 14+
- Python 3.8+
- MongoDB (for storing interview sessions)
- CUDA (optional, for GPU acceleration)

---

## ⚡ Quick Setup (5 minutes)

### **Step 1: Install ML Service Dependencies**
```bash
cd ml_service
pip install -r requirements.txt
```

### **Step 2: Start the ML Service**
```bash
# From ml_service directory
python -m uvicorn app:app --reload --port 8000
```

You should see:
```
Uvicorn running on http://127.0.0.1:8000
```

### **Step 3: Verify ML Service is Running**
```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "ok",
  "models": {
    "whisper": true,
    "transformers": true,
    "sklearn": true,
    "torch": true,
    "librosa": true,
    "sentence_transformers": true,
    "genai": true
  }
}
```

### **Step 4: Update Interview Routes in Node Server**

Create/update file: `server/routes/interviewRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Routes
router.post('/start', authMiddleware, interviewController.startInterview);
router.post('/submit', authMiddleware, upload.single('audio'), interviewController.submitAnswer);
router.post('/end', authMiddleware, interviewController.endInterview);
router.get('/history', authMiddleware, interviewController.getSessionHistory);
router.get('/progress', authMiddleware, interviewController.getProgress);
router.get('/:sessionId', authMiddleware, interviewController.getSessionDetail);
router.get('/health', interviewController.health);

module.exports = router;
```

### **Step 5: Register Route in Server**

In `server/index.js`:
```javascript
const interviewRoutes = require('./routes/interviewRoutes');
app.use('/api/interview', interviewRoutes);
```

### **Step 6: Start Node Server**
```bash
cd server
npm install
npm start
```

### **Step 7: Start React Client**
```bash
cd client
npm install
npm start
```

---

## 🎯 Test the System

### **Flow 1: Start Interview**
```bash
curl -X POST http://localhost:5000/api/interview/start \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_TOKEN" \
  -d '{"role": "Frontend Developer"}'
```

### **Flow 2: Submit Answer (with audio file)**
```bash
curl -X POST http://localhost:5000/api/interview/submit \
  -H "x-auth-token: YOUR_TOKEN" \
  -F "audio_file=@interview_answer.wav" \
  -F "role=Frontend Developer" \
  -F "history=[]" \
  -F "question=Tell me about yourself"
```

Response will include all 5 phases of analysis!

---

## 📊 Example Response

When submitting an answer, you'll receive comprehensive data:

```json
{
  "transcription": "I am a React developer with 3 years experience...",
  
  "clarity": 8,
  "relevance": 7,
  "technical_depth": 7,
  "keywords_matched": ["React", "3 years", "experience"],
  
  "readiness_status": "Ready",
  "readiness_score": 73,
  "weak_areas": [],
  "strong_areas": ["Good communication", "Strong technical knowledge"],
  
  "progress": {
    "trend": "Improving",
    "improvement_rate": 5.2,
    "estimated_ready_date": "Already Ready!",
    "current_score": 73,
    "previous_score": 69
  },
  
  "speech_analysis": {
    "tone": "Confident",
    "speech_rate": 130,
    "filler_words": 1,
    "energy_level": "High",
    "clarity_score": 92,
    "pause_analysis": {
      "total_pauses": 2,
      "average_pause_duration": 0.8,
      "pauses_per_minute": 3.0
    }
  },
  
  "feedback": "Excellent technical depth and clear communication!",
  "next_question": "Can you tell me about your most challenging project?",
  "rating": 73,
  "confidence_score": 73,
  "status_label": "Ready"
}
```

---

## 🎨 Frontend Usage

### **Using Analytics Component**

```jsx
import InterviewAnalytics from './components/InterviewAnalytics';

function ResultsPage() {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch from backend after interview
    fetchSessionResults();
  }, []);

  return (
    <div>
      <h1>Interview Results</h1>
      <InterviewAnalytics 
        sessionData={sessionData}
        isLoading={loading}
      />
    </div>
  );
}
```

### **Component Tabs**
- **Overview:** NLP scores (clarity, relevance, depth), keywords, strengths/weaknesses
- **Speech:** Tone, speech rate, filler analysis, energy level
- **Progress:** Trend analysis, improvement rate, estimated ready date
- **Recommendations:** Personalized improvement suggestions

---

## 🔑 Environment Variables

Create `.env` in `ml_service/`:
```env
GEMINI_API_KEY=your_gemini_key_here
WHISPER_MODEL=tiny  # or base, small, medium, large
```

---

## ⚙️ Configuration

### **Adjust ML Model Size** (in `ml_service/app.py`)
```python
_WHISPER_MODEL_NAME = "tiny"  # tiny, base, small, medium, large
```

### **Change Readiness Score Threshold**
In `ml_service/app.py`, line ~390:
```python
status = "Ready" if avg_readiness >= 70 else "Not Ready"  # Change 70 threshold
```

### **Add Custom Role Keywords**
In `ml_service/app.py`, `NLPAnalyzer.analyze_technical_depth()`:
```python
role_keywords = {
    "your_role": ["keyword1", "keyword2", "keyword3"]
}
```

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "ML service unreachable" | Check if ML service is running on port 8000 |
| Audio transcription fails | Ensure audio file is WAV or MP3 format |
| Models downloading slowly | First run downloads ~1.5GB; be patient |
| Memory issues | Use smaller Whisper model or disable GPU |
| CORS errors | Check CORS middleware in both services |

---

## 📈 What Happens Behind the Scenes

1. **User speaks answer** → Audio recorded (Phase 1)
2. **Audio sent to ML service** → Phases 1-5 analysis triggered:
   - Whisper transcribes audio (Phase 1)
   - BERT analyzes clarity/relevance/depth (Phase 2)
   - ML classifier predicts readiness (Phase 3)
   - LSTM tracks improvement (Phase 4)
   - Librosa analyzes speech patterns (Phase 5)
3. **Results stored in MongoDB** → InterviewSession document
4. **Frontend displays analytics** → InterviewAnalytics component
5. **User sees recommendations** → Personalized feedback

---

## 📊 Key Metrics Quick Reference

| Metric | Range | What It Means |
|--------|-------|---------------|
| Clarity | 0-10 | How well structured and articulated the answer is |
| Relevance | 0-10 | How directly the answer addresses the question |
| Technical Depth | 0-10 | Level of technical knowledge demonstrated |
| Readiness Score | 0-100 | Overall interview readiness (70+ = Ready) |
| Speech Rate | WPM | Words per minute (120-140 is ideal) |
| Filler Count | 0+ | Number of filler words (um, uh, like) |
| Energy Level | Low/Med/High | Based on speech patterns and content |

---

## 🎓 Learning from Results

**After each interview:**
1. Check "weak areas" tab
2. Review speech analysis for tone/pauses
3. Look at progress trend
4. Follow recommendations in "recommendations" tab
5. Practice and retake interview

**Track improvement over time:**
1. Go to progress analytics
2. See trend (Improving/Stable/Declining)
3. Check estimated ready date
4. Celebrate milestones! 🎉

---

## 🚀 Next Steps

1. ✅ Start the ML service
2. ✅ Test /health endpoint
3. ✅ Run an interview through the UI
4. ✅ Check analytics dashboard
5. ✅ Iterate and improve!

---

## 📞 Support

- **ML Service Issues:** Check `ml_service/` logs
- **Backend Issues:** Check `server/` logs  
- **Frontend Issues:** Check browser console

---

**Happy Interviewing! 🎤✨**
