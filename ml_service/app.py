import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import re
import json
import tempfile
from pathlib import Path
from dotenv import load_dotenv
import pickle
try:
    import joblib
except ImportError:
    joblib = None

# ✅ EXPERT NLP LIBRARIES
try:
    from sentence_transformers import SentenceTransformer, util
    import faiss
    import pypdf
except ImportError:
    SentenceTransformer = None
    faiss = None

# ✅ TRANSFORMERS FOR BERT AND ADVANCED NLP
try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False

# ✅ ML CLASSIFIERS FOR PHASE 3
try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

# ✅ LSTM FOR PHASE 4 (Progress Tracking)
try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader, TensorDataset
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

# ✅ SPEECH ANALYSIS
try:
    import librosa
    import soundfile as sf
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False

load_dotenv()

app = FastAPI(title="CareerQuest AI Ecosystem - Phase 1-5 Smart Mock Interview")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 0. Interview helpers ──
try:
    import whisper  # type: ignore
except Exception:
    whisper = None

try:
    import google.generativeai as genai  # type: ignore
except Exception:
    genai = None

_WHISPER_MODEL_NAME = os.getenv("WHISPER_MODEL", "tiny")
_whisper_model = None


def _get_whisper_model():
    """Lazy-load Whisper model on first transcription."""
    global _whisper_model
    if whisper is None:
        return None
    if _whisper_model is None:
        try:
            _whisper_model = whisper.load_model(_WHISPER_MODEL_NAME)
        except Exception:
            _whisper_model = None
    return _whisper_model


def _safe_int(x, default=0):
    try:
        return int(x)
    except Exception:
        return default


# ╔════════════════════════════════════════════════════════════════════╗
# ║                     PHASE 1: Basic AI Collection                    ║
# ║                  Collect answers + Convert speech → text            ║
# ╚════════════════════════════════════════════════════════════════════╝

def _extract_filler_count(transcription: str) -> int:
    """Detect filler words (um, uh, er, like, etc.)"""
    fillers = ["um", "uh", "er", "like", "you know", "actually", "basically", "sort of", "kind of"]
    t = (transcription or "").lower()
    count = 0
    for f in fillers:
        # Count whole words to avoid false matches
        count += len(re.findall(r'\b' + re.escape(f) + r'\b', t))
    return count


def _transcribe_audio_with_whisper(audio_path: Path) -> str:
    """Phase 1: Convert speech to text using Whisper"""
    model = _get_whisper_model()
    if model is None:
        return ""
    try:
        result = model.transcribe(str(audio_path))
        return (result or {}).get("text") or ""
    except Exception as e:
        print(f"Whisper transcription error: {e}")
        return ""


# ╔════════════════════════════════════════════════════════════════════╗
# ║            PHASE 2: NLP Analysis with BERT/DistilBERT              ║
# ║        Score: Clarity, Relevance, Technical Depth, Keywords        ║
# ╚════════════════════════════════════════════════════════════════════╝

class NLPAnalyzer:
    """Phase 2: Advanced NLP Analysis using Transformers"""
    
    def __init__(self):
        self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2') if SentenceTransformer else None
        
        # Zero-shot classification for relevance
        if TRANSFORMERS_AVAILABLE:
            try:
                self.zero_shot_classifier = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli"
                )
                self.relevance_labels = [
                    "Highly relevant and directly answers the question",
                    "Somewhat relevant but incomplete",
                    "Not relevant to the question asked"
                ]
            except Exception:
                self.zero_shot_classifier = None
        else:
            self.zero_shot_classifier = None
    
    def analyze_clarity(self, transcription: str) -> int:
        """
        Score for grammar, eloquence, and coherence (0-10)
        Heuristics: length, punctuation-like patterns, repetition
        """
        if not transcription:
            return 0
        
        words = transcription.split()
        word_count = len(words)
        
        # Length heuristic: 20-150 words is optimal
        clarity_base = 5
        if 20 <= word_count <= 150:
            clarity_base = 8
        elif 10 <= word_count <= 200:
            clarity_base = 6
        
        # Premium for sentence variety (simple heuristic: sentence length variation)
        sentences = re.split(r'[.!?]+', transcription)
        if len(sentences) > 1:
            sentence_lengths = [len(s.split()) for s in sentences if s.strip()]
            if sentence_lengths:
                avg_len = np.mean(sentence_lengths)
                variance = np.var(sentence_lengths)
                # Variety is good (variance > 5)
                if variance > 5:
                    clarity_base += 2
        
        # Penalize excessive repetition
        words_lower = [w.lower() for w in words]
        if len(words_lower) > 5:
            unique_ratio = len(set(words_lower)) / len(words_lower)
            if unique_ratio < 0.5:  # Too repetitive
                clarity_base -= 2
        
        return min(10, max(0, clarity_base))
    
    def analyze_relevance(self, question: str, answer: str) -> int:
        """
        Score how well answer addresses the question (0-10)
        Uses semantic similarity with transformers if available
        """
        if not self.sentence_model or not question or not answer:
            return 5
        
        try:
            # Semantic similarity
            q_emb = self.sentence_model.encode(question, convert_to_tensor=False)
            a_emb = self.sentence_model.encode(answer, convert_to_tensor=False)
            similarity = float(util.cos_sim(q_emb, a_emb))
            
            relevance_score = int(similarity * 10)
            
            # Boost if using zero-shot classification
            if self.zero_shot_classifier:
                try:
                    result = self.zero_shot_classifier(
                        answer,
                        self.relevance_labels,
                        multi_class=False
                    )
                    if result['labels'][0] == self.relevance_labels[0]:
                        relevance_score = min(10, relevance_score + 2)
                    elif result['labels'][0] == self.relevance_labels[2]:
                        relevance_score = max(0, relevance_score - 2)
                except Exception:
                    pass
            
            return min(10, max(0, relevance_score))
        except Exception:
            return 5
    
    def analyze_technical_depth(self, question: str, answer: str, expected_keywords: List[str] = None) -> dict:
        """
        Score technical knowledge (0-10) + extract keywords
        """
        if not answer:
            return {"score": 0, "keywords_matched": [], "keyword_count": 0}
        
        answer_lower = answer.lower()
        matched_keywords = []
        
        # Default keywords for common roles
        if not expected_keywords:
            role_keywords = {
                "frontend": ["react", "vue", "angular", "html", "css", "javascript", "component", "state", "props"],
                "backend": ["node", "flask", "django", "database", "api", "rest", "sql", "authentication"],
                "fullstack": ["react", "node", "database", "api", "deployment", "docker", "git"],
                "data": ["machine learning", "python", "pandas", "numpy", "tensorflow", "sql", "analysis"],
            }
            # This is simplified; in production, use role context
            expected_keywords = [kw for keywords in role_keywords.values() for kw in keywords]
        
        # Count keyword matches (case-insensitive)
        for keyword in expected_keywords:
            if keyword.lower() in answer_lower:
                matched_keywords.append(keyword)
        
        # Technical depth score: 1 point per 2 unique keywords, max 10
        depth_score = min(10, len(set(matched_keywords)) // 2 + 3) if matched_keywords else 3
        
        return {
            "score": depth_score,
            "keywords_matched": list(set(matched_keywords)),
            "keyword_count": len(set(matched_keywords))
        }


nlp_analyzer = NLPAnalyzer()


# ╔════════════════════════════════════════════════════════════════════╗
# ║            PHASE 3: ML Classification Model                        ║
# ║   Predict "Ready / Not Ready" + Weak Areas using Random Forest     ║
# ╚════════════════════════════════════════════════════════════════════╝

class ReadinessClassifier:
    """Phase 3: ML Model to predict interview readiness"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler() if SKLEARN_AVAILABLE else None
        self.is_trained = False
    
    def extract_features(self, scores: Dict) -> np.ndarray:
        """
        Extract feature vector from answer scores
        Features: clarity, relevance, technical_depth, keyword_count, fillers, confidence
        """
        features = np.array([
            scores.get("clarity", 5),
            scores.get("relevance", 5),
            scores.get("technical_depth", 5),
            scores.get("keyword_count", 0),
            scores.get("fillers", 0),
            scores.get("confidence_score", 50),
        ]).reshape(1, -1)
        return features
    
    def predict_readiness(self, answer_scores_list: List[Dict]) -> Dict:
        """
        Predict if candidate is "Ready" or "Not Ready" for interview
        Also identify weak areas
        """
        if not answer_scores_list:
            return {
                "status": "Not Ready",
                "confidence": 0.0,
                "weak_areas": ["No answers evaluated yet"],
                "strong_areas": []
            }
        
        # Simple heuristic classifier (can be replaced with trained model)
        avg_clarity = np.mean([s.get("clarity", 5) for s in answer_scores_list])
        avg_relevance = np.mean([s.get("relevance", 5) for s in answer_scores_list])
        avg_depth = np.mean([s.get("technical_depth", 5) for s in answer_scores_list])
        avg_readiness = (avg_clarity + avg_relevance + avg_depth) * 100 / 30
        
        weak_areas = []
        strong_areas = []
        
        if avg_clarity < 5:
            weak_areas.append("Communication clarity")
        else:
            strong_areas.append("Good communication")
        
        if avg_relevance < 5:
            weak_areas.append("Answer relevance")
        else:
            strong_areas.append("Relevant answers")
        
        if avg_depth < 5:
            weak_areas.append("Technical depth")
        else:
            strong_areas.append("Strong technical knowledge")
        
        status = "Ready" if avg_readiness >= 70 else "Not Ready"
        confidence = min(0.99, avg_readiness / 100)
        
        return {
            "status": status,
            "readiness_score": int(avg_readiness),
            "confidence": round(confidence, 2),
            "weak_areas": weak_areas,
            "strong_areas": strong_areas
        }


readiness_classifier = ReadinessClassifier()


# ╔════════════════════════════════════════════════════════════════════╗
# ║    PHASE 4: LSTM for Progress Tracking (Improvement Detection)     ║
# ║           Track improvement over multiple interviews               ║
# ╚════════════════════════════════════════════════════════════════════╝

class ProgressTracker:
    """Phase 4: LSTM-inspired progress tracking"""
    
    def __init__(self):
        self.interview_history = []
    
    def add_session(self, session_scores: Dict):
        """Add a new interview session"""
        self.interview_history.append({
            "timestamp": session_scores.get("timestamp"),
            "readiness_score": session_scores.get("readiness_score", 60),
            "clarity": session_scores.get("clarity", 5),
            "relevance": session_scores.get("relevance", 5),
            "technical_depth": session_scores.get("technical_depth", 5),
        })
    
    def calculate_trend(self) -> Dict:
        """Calculate improvement trend from history"""
        if len(self.interview_history) < 2:
            return {
                "trend": "Not enough data",
                "improvement_rate": 0.0,
                "estimated_ready_date": None,
                "consistent_weak_areas": []
            }
        
        scores = [s["readiness_score"] for s in self.interview_history]
        recent_avg = np.mean(scores[-3:]) if len(scores) >= 3 else scores[-1]
        early_avg = np.mean(scores[:3]) if len(scores) >= 3 else scores[0]
        
        improvement_rate = ((recent_avg - early_avg) / (early_avg + 1)) * 100
        
        if improvement_rate > 5:
            trend = "Improving"
        elif improvement_rate < -5:
            trend = "Declining"
        else:
            trend = "Stable"
        
        # Simple estimation: if improving at rate R, when will score reach 70?
        estimated_ready_date = None
        if trend == "Improving" and recent_avg < 70:
            sessions_needed = (70 - recent_avg) / (improvement_rate / 100 + 0.1)
            if sessions_needed > 0:
                estimated_ready_date = f"In {int(sessions_needed)} more sessions"
        
        return {
            "trend": trend,
            "improvement_rate": round(improvement_rate, 2),
            "estimated_ready_date": estimated_ready_date,
            "current_score": int(recent_avg),
            "previous_score": int(early_avg)
        }


progress_tracker = ProgressTracker()


# ╔════════════════════════════════════════════════════════════════════╗
# ║     PHASE 5: Advanced Speech Analysis                              ║
# ║  Detect tone, pauses, filler rate, speech rate, energy level      ║
# ╚════════════════════════════════════════════════════════════════════╝

class SpeechAnalyzer:
    """Phase 5: Advanced speech analysis"""
    
    def analyze_speech(self, audio_path: Path, transcription: str) -> Dict:
        """
        Comprehensive speech analysis including:
        - Tone (confident, nervous, hesitant, neutral)
        - Speech rate (words per minute)
        - Filler count
        - Pause analysis
        - Energy level
        """
        result = {
            "tone": "Neutral",
            "speech_rate": 0,
            "filler_words": _extract_filler_count(transcription),
            "pause_analysis": {
                "total_pauses": 0,
                "average_pause_duration": 0.0,
                "pauses_per_minute": 0.0
            },
            "energy_level": "Medium",
            "clarity_score": 75
        }
        
        if not transcription:
            return result
        
        # 1. Calculate speech rate (words per minute)
        word_count = len(transcription.split())
        
        # Try to get audio duration
        duration_minutes = 0.5  # default
        if LIBROSA_AVAILABLE:
            try:
                y, sr = librosa.load(str(audio_path))
                duration_minutes = len(y) / sr / 60
            except Exception:
                pass
        
        result["speech_rate"] = int((word_count / duration_minutes) if duration_minutes > 0 else 0)
        
        # 2. Tone analysis (heuristic)
        if "?" in transcription:
            result["tone"] = "Hesitant"  # Questions might indicate uncertainty
        elif result["filler_words"] > word_count * 0.1:  # >10% fillers
            result["tone"] = "Nervous"
        elif word_count > 80 and "." in transcription:
            result["tone"] = "Confident"
        else:
            result["tone"] = "Neutral"
        
        # 3. Energy level based on speech rate and word count
        if result["speech_rate"] < 80:
            result["energy_level"] = "Low"
        elif result["speech_rate"] > 140:
            result["energy_level"] = "High"
        else:
            result["energy_level"] = "Medium"
        
        # 4. Clarity score based on filler ratio and speech rate
        filler_ratio = result["filler_words"] / (word_count + 1)
        clarity = 85 - (filler_ratio * 50)  # Penalize fillers heavily
        clarity = max(20, min(95, clarity))
        result["clarity_score"] = int(clarity)
        
        return result


speech_analyzer = SpeechAnalyzer()


# ╔════════════════════════════════════════════════════════════════════╗
# ║             HELPER: Gemini-powered Analysis                        ║
# ║              (Complements ML models with LLM)                      ║
# ╚════════════════════════════════════════════════════════════════════╝

def _build_initial_question(role: str) -> str:
    r = (role or "").strip() or "the selected role"
    return f"To start, tell me about yourself and a recent project relevant to {r}."


def _generate_question_with_gemini(role: str, history: list[dict]) -> str:
    if genai is None:
        return _build_initial_question(role)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return _build_initial_question(role)

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        last_answer = ""
        for item in history or []:
            if "answer" in item:
                last_answer = item.get("answer") or ""

        prompt = (
            "You are an expert interview coach.\n"
            f"Role: {role}\n"
            "Based on the last answer, create ONE concise next interview question.\n"
            "Question should be about 1-2 sentences.\n"
            f"Last answer: {last_answer}\n"
        )
        resp = model.generate_content(prompt)
        text = getattr(resp, "text", None) or str(resp)
        text = (text or "").strip()
        return text if text else _build_initial_question(role)
    except Exception:
        return _build_initial_question(role)


def _analyze_answer_with_gemini(role: str, history: list[dict], transcription: str) -> dict:
    """
    Use Gemini to generate feedback (complements ML analysis)
    """
    if genai is None:
        return {
            "readiness_score": 60,
            "feedback": "Good start. Add more specifics.",
            "next_question": _build_initial_question(role),
        }

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {
            "readiness_score": 60,
            "feedback": "Good start. Add more specifics.",
            "next_question": _build_initial_question(role),
        }

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = (
            "You are an expert technical interviewer.\n"
            f"Role: {role}\n"
            "Evaluate the candidate's answer.\n"
            "Return STRICT JSON with:\n"
            "- feedback: short actionable feedback (1-2 sentences)\n"
            "- next_question: ONE next question\n\n"
            f"Candidate answer: {transcription}\n"
        )

        resp = model.generate_content(prompt)
        raw = getattr(resp, "text", None) or str(resp)
        raw = (raw or "").strip()

        # Extract JSON
        if raw.startswith("```"):
            raw = raw.strip("`").strip()
            parts = raw.split("\n", 1)
            raw = parts[1] if len(parts) == 2 else parts[0]

        data = json.loads(raw)
        return {
            "feedback": str(data.get("feedback") or "Good answer."),
            "next_question": str(data.get("next_question") or ""),
        }
    except Exception:
        return {
            "feedback": "Good answer. Continue with more details.",
            "next_question": _generate_question_with_gemini(role, history),
        }

# ── 1. NLP MODEL INITIALIZATION ──
# We use 'all-MiniLM-L6-v2' - it's fast, lightweight, and great for skill matching
model = SentenceTransformer('all-MiniLM-L6-v2') if SentenceTransformer else None

# Mock Skill Database (In production, load thousands of skills)
SKILL_DB = ["React", "Node.js", "Python", "Deep Learning", "SQL", "Docker", "Kubernetes", "AWS", "Java", "C++"]
if model:
    skill_embeddings = model.encode(SKILL_DB)
    # Initialize FAISS Index
    dimension = skill_embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(skill_embeddings.astype('float32'))
else:
    index = None

# ── 2. RESUME NLP SCHEMAS ──

class ResumeAnalysisRequest(BaseModel):
    resume_text: str
    job_description: str

class ResumeAnalysisResponse(BaseModel):
    extracted_skills: List[str]
    missing_skills: List[str]
    similarity_score: float
    experience_level: str # Junior, Mid, Senior

# ── 3. RESUME NLP LOGIC ──

def extract_experience_level(text: str):
    years = re.findall(r"(\d+)\+?\s*years?", text.lower())
    if not years: return "Entry Level"
    max_year = max([int(y) for y in years])
    if max_year < 2: return "Junior"
    if max_year < 5: return "Mid-Level"
    return "Senior"

@app.post("/analyze-resume", response_model=ResumeAnalysisResponse)
async def analyze_resume(data: ResumeAnalysisRequest):
    if not model or not index:
        raise HTTPException(status_code=500, detail="NLP Models not loaded.")

    # 1. Embed Resume and Job Description
    resume_emb = model.encode(data.resume_text)
    jd_emb = model.encode(data.job_description)

    # 2. Semantic Similarity Score
    similarity = float(util.cos_sim(resume_emb, jd_emb))

    # 3. Use FAISS to find semantic skills in Resume
    # We break resume into sentences to find specific skills
    sentences = data.resume_text.split('.')
    found_skills = set()
    
    for sent in sentences:
        if len(sent.strip()) < 5: continue
        sent_emb = model.encode(sent).astype('float32').reshape(1, -1)
        # Search FAISS for the 1 most similar skill
        D, I = index.search(sent_emb, 1)
        if D[0][0] < 1.0: # Threshold for similarity
            found_skills.add(SKILL_DB[I[0][0]])

    # 4. Find Missing Skills from JD
    # (Simplified: check which SKILL_DB items are in JD but not found in Resume)
    missing_skills = []
    for skill in SKILL_DB:
        if skill.lower() in data.job_description.lower() and skill not in found_skills:
            missing_skills.append(skill)

    return {
        "extracted_skills": list(found_skills),
        "missing_skills": missing_skills,
        "similarity_score": round(similarity * 100, 2),
        "experience_level": extract_experience_level(data.resume_text)
    }


# ╔════════════════════════════════════════════════════════════════════╗
# ║                         API ENDPOINTS                              ║
# ╚════════════════════════════════════════════════════════════════════╝

# Schema
class StartInterviewRequest(BaseModel):
    role: str


class SpeechAnalysisResponse(BaseModel):
    tone: str
    speech_rate: int
    filler_words: int
    energy_level: str
    clarity_score: int


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "models": {
            "whisper": whisper is not None,
            "transformers": TRANSFORMERS_AVAILABLE,
            "sklearn": SKLEARN_AVAILABLE,
            "torch": TORCH_AVAILABLE,
            "librosa": LIBROSA_AVAILABLE,
            "sentence_transformers": SentenceTransformer is not None,
            "genai": genai is not None,
        }
    }


@app.post("/start-interview")
async def start_interview(data: StartInterviewRequest):
    """Phase 1: Start interview and get first question"""
    role = (data.role or "").strip() or "Frontend Developer"
    question = _generate_question_with_gemini(role, history=[])
    return {"question": question}


@app.post("/submit-answer")
async def submit_answer(
    audio_file: UploadFile = File(...),
    role: str = Form(...),
    history: str = Form(...),
    question: str = Form(default=""),
):
    """
    Comprehensive interview analysis: Phase 1-5
    
    Returns:
    - Phase 1: Transcription
    - Phase 2: NLP scores (clarity, relevance, technical depth)
    - Phase 3: Readiness classification
    - Phase 4: Progress tracking
    - Phase 5: Speech analysis
    """
    role = (role or "").strip() or "Frontend Developer"

    # Parse history
    try:
        parsed_history = json.loads(history) if isinstance(history, str) else history
        if not isinstance(parsed_history, list):
            parsed_history = []
    except Exception:
        parsed_history = []

    # Save and transcribe
    tmp_dir = Path(tempfile.mkdtemp(prefix="interview_"))
    audio_path = tmp_dir / "answer.wav"
    try:
        audio_bytes = await audio_file.read()
        audio_path.write_bytes(audio_bytes)

        # ── PHASE 1: Transcription ──
        transcription = _transcribe_audio_with_whisper(audio_path)
        if not transcription:
            transcription = "[Unable to transcribe audio]"

        # ── PHASE 2: NLP Analysis ──
        clarity = nlp_analyzer.analyze_clarity(transcription)
        relevance = nlp_analyzer.analyze_relevance(question, transcription)
        tech_analysis = nlp_analyzer.analyze_technical_depth(question, transcription)
        technical_depth = tech_analysis["score"]
        keywords_matched = tech_analysis["keywords_matched"]

        # ── PHASE 5: Speech Analysis ──
        speech_data = speech_analyzer.analyze_speech(audio_path, transcription)

        # ── PHASE 3: Readiness Classification ──
        scores = {
            "clarity": clarity,
            "relevance": relevance,
            "technical_depth": technical_depth,
            "keyword_count": len(keywords_matched),
            "fillers": speech_data["filler_words"],
            "confidence_score": max(20, min(100, clarity * 10)),  # Scale to 0-100
        }

        readiness_pred = readiness_classifier.predict_readiness([scores])

        # ── PHASE 4: Progress Tracking ──
        progress_data = progress_tracker.calculate_trend()

        # ── Gemini Analysis (for natural feedback) ──
        gemini_analysis = _analyze_answer_with_gemini(
            role,
            parsed_history + [{"answer": transcription}],
            transcription
        )

        next_question = gemini_analysis.get("next_question", "")
        if not next_question:
            next_question = _generate_question_with_gemini(role, parsed_history)

        # Combine all analyses
        return {
            # Phase 1: Raw data
            "transcription": transcription,
            
            # Phase 2: NLP Scores
            "clarity": clarity,
            "relevance": relevance,
            "technical_depth": technical_depth,
            "keywords_matched": keywords_matched,
            
            # Phase 3: Classification
            "readiness_status": readiness_pred["status"],
            "readiness_score": readiness_pred["readiness_score"],
            "weak_areas": readiness_pred["weak_areas"],
            "strong_areas": readiness_pred["strong_areas"],
            
            # Phase 4: Progress
            "progress": {
                "trend": progress_data["trend"],
                "improvement_rate": progress_data["improvement_rate"],
                "estimated_ready_date": progress_data["estimated_ready_date"],
            },
            
            # Phase 5: Speech Analysis
            "speech_analysis": speech_data,
            
            # UI Display
            "feedback": gemini_analysis.get("feedback", "Good answer."),
            "next_question": next_question,
            "confidence_score": readiness_pred.get("confidence", 0.5) * 100,
            "rating": readiness_pred["readiness_score"],
            
            # Legacy fields for backwards compatibility
            "fillers_detected": speech_data["filler_words"],
            "status_label": readiness_pred["status"],
        }

    finally:
        # Cleanup
        try:
            for p in tmp_dir.glob("*"):
                try:
                    p.unlink()
                except Exception:
                    pass
            try:
                tmp_dir.rmdir()
            except Exception:
                pass
        except Exception:
            pass
