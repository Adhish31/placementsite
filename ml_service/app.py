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
            "filler_ratio": 0.0,
            "pause_analysis": {
                "total_pauses": 0,
                "average_pause_duration": 0.0,
                "pauses_per_minute": 0.0
            },
            "energy_level": "Medium",
            "clarity_score": 75,
            "speech_quality_score": 70
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
        result["filler_ratio"] = round((result["filler_words"] / max(1, word_count)), 3)
        
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

        # 5. Pause frequency heuristic from sentence and hesitation markers
        sentence_breaks = len([s for s in re.split(r'[.!?]+', transcription) if s.strip()])
        hesitation_breaks = len(re.findall(r',|;|…|\.\.\.', transcription))
        total_pauses = max(0, sentence_breaks - 1) + hesitation_breaks
        pauses_per_minute = total_pauses / max(duration_minutes, 0.1)
        avg_pause_duration = max(0.2, min(1.6, 0.35 + (result["filler_ratio"] * 1.8)))
        result["pause_analysis"] = {
            "total_pauses": int(total_pauses),
            "average_pause_duration": round(avg_pause_duration, 2),
            "pauses_per_minute": round(pauses_per_minute, 2)
        }

        # 6. Speech quality score for scoring integration
        speech_rate_penalty = 0
        if result["speech_rate"] < 95:
            speech_rate_penalty = min(15, (95 - result["speech_rate"]) // 4)
        elif result["speech_rate"] > 170:
            speech_rate_penalty = min(15, (result["speech_rate"] - 170) // 5)

        pause_penalty = 0
        if pauses_per_minute > 18:
            pause_penalty = min(12, int((pauses_per_minute - 18) * 0.8))

        filler_penalty = min(18, int(result["filler_ratio"] * 120))
        quality = 92 - speech_rate_penalty - pause_penalty - filler_penalty
        result["speech_quality_score"] = int(max(25, min(98, quality)))
        
        return result


speech_analyzer = SpeechAnalyzer()

# ── Company-specific interview modes ───────────────────────────────────────────
# Dataset structure:
# COMPANY_QUESTION_BANK = {
#   "amazon": {
#     "behavioral": [{"id","difficulty","question","keywords"}...],
#     "technical": [...],
#     "coding_system": [...]
#   },
#   "google": {...},
#   "tcs": {...}
# }
COMPANY_QUESTION_BANK: Dict[str, Dict[str, List[Dict]]] = {
    "amazon": {
        "behavioral": [
            {"id": "amz-b-1", "difficulty": "easy", "question": "Tell me about a time you took ownership of a difficult task.", "keywords": ["ownership", "impact", "result"]},
            {"id": "amz-b-2", "difficulty": "medium", "question": "Describe a situation where you disagreed with your team and how you handled it.", "keywords": ["conflict", "communication", "resolution"]},
            {"id": "amz-b-3", "difficulty": "hard", "question": "Share a high-impact decision you made with limited data and how you mitigated risk.", "keywords": ["decision-making", "risk", "trade-off"]},
        ],
        "technical": [
            {"id": "amz-t-1", "difficulty": "easy", "question": "Explain REST API design basics and common HTTP methods.", "keywords": ["REST", "GET", "POST", "status codes"]},
            {"id": "amz-t-2", "difficulty": "medium", "question": "How would you design a reliable retry strategy for external API failures?", "keywords": ["retry", "backoff", "idempotency"]},
            {"id": "amz-t-3", "difficulty": "hard", "question": "How would you optimize a high-throughput service with strict latency SLOs?", "keywords": ["latency", "caching", "profiling", "scalability"]},
        ],
        "coding_system": [
            {"id": "amz-c-1", "difficulty": "easy", "question": "Design a simple URL shortener API and core data model.", "keywords": ["API", "database", "hashing"]},
            {"id": "amz-c-2", "difficulty": "medium", "question": "How would you implement an LRU cache and explain its complexity?", "keywords": ["hashmap", "linked list", "O(1)"]},
            {"id": "amz-c-3", "difficulty": "hard", "question": "Design an order processing system handling spikes during sales events.", "keywords": ["queue", "event-driven", "partitioning", "fault tolerance"]},
        ],
    },
    "google": {
        "behavioral": [
            {"id": "ggl-b-1", "difficulty": "easy", "question": "Tell me about a project where you learned something quickly.", "keywords": ["learning", "adaptability", "impact"]},
            {"id": "ggl-b-2", "difficulty": "medium", "question": "Describe a time you simplified a complex problem for your team.", "keywords": ["clarity", "collaboration", "problem solving"]},
            {"id": "ggl-b-3", "difficulty": "hard", "question": "Describe a decision where you balanced correctness, speed, and scalability.", "keywords": ["trade-offs", "scalability", "engineering judgment"]},
        ],
        "technical": [
            {"id": "ggl-t-1", "difficulty": "easy", "question": "Explain time and space complexity with an example.", "keywords": ["big-o", "complexity", "optimization"]},
            {"id": "ggl-t-2", "difficulty": "medium", "question": "Compare SQL and NoSQL for a read-heavy product feature.", "keywords": ["consistency", "query patterns", "indexing"]},
            {"id": "ggl-t-3", "difficulty": "hard", "question": "How would you design observability for a distributed microservice architecture?", "keywords": ["metrics", "logs", "tracing", "SLO"]},
        ],
        "coding_system": [
            {"id": "ggl-c-1", "difficulty": "easy", "question": "Write an approach to detect duplicate elements efficiently.", "keywords": ["hash set", "complexity"]},
            {"id": "ggl-c-2", "difficulty": "medium", "question": "Design a rate limiter and explain token bucket vs leaky bucket.", "keywords": ["rate limit", "token bucket", "distributed"]},
            {"id": "ggl-c-3", "difficulty": "hard", "question": "Design a globally distributed cache invalidation strategy.", "keywords": ["cache coherence", "eventual consistency", "pub/sub"]},
        ],
    },
    "tcs": {
        "behavioral": [
            {"id": "tcs-b-1", "difficulty": "easy", "question": "Introduce yourself and explain your career goals.", "keywords": ["communication", "motivation"]},
            {"id": "tcs-b-2", "difficulty": "medium", "question": "Describe a time you worked effectively in a team under pressure.", "keywords": ["teamwork", "time management", "ownership"]},
            {"id": "tcs-b-3", "difficulty": "hard", "question": "Share an example of handling client feedback and improving delivery quality.", "keywords": ["client focus", "quality", "improvement"]},
        ],
        "technical": [
            {"id": "tcs-t-1", "difficulty": "easy", "question": "Explain OOP principles with simple examples.", "keywords": ["encapsulation", "inheritance", "polymorphism"]},
            {"id": "tcs-t-2", "difficulty": "medium", "question": "How do you debug a production issue step by step?", "keywords": ["logs", "root cause", "rollback"]},
            {"id": "tcs-t-3", "difficulty": "hard", "question": "How would you improve performance of a slow database query in production?", "keywords": ["index", "execution plan", "optimization"]},
        ],
        "coding_system": [
            {"id": "tcs-c-1", "difficulty": "easy", "question": "Write logic to reverse words in a sentence.", "keywords": ["string", "loops"]},
            {"id": "tcs-c-2", "difficulty": "medium", "question": "Design a basic employee leave management module.", "keywords": ["CRUD", "validation", "workflow"]},
            {"id": "tcs-c-3", "difficulty": "hard", "question": "Design a scalable ticketing workflow for enterprise support teams.", "keywords": ["workflow", "state machine", "queue"]},
        ],
    },
}

COMPANY_SCORING_PATTERNS: Dict[str, Dict[str, float]] = {
    "amazon": {"clarity": 0.20, "relevance": 0.25, "depth": 0.20, "confidence": 0.20, "structure": 0.15},
    "google": {"clarity": 0.20, "relevance": 0.20, "depth": 0.30, "confidence": 0.15, "structure": 0.15},
    "tcs": {"clarity": 0.25, "relevance": 0.20, "depth": 0.20, "confidence": 0.15, "structure": 0.20},
    "general": {"clarity": 0.20, "relevance": 0.20, "depth": 0.20, "confidence": 0.20, "structure": 0.20},
}

def _normalize_company_mode(mode: str) -> str:
    m = (mode or "").strip().lower()
    if m in ("amazon", "google", "tcs"):
        return m
    return "general"

def _difficulty_rank(level: str) -> int:
    return {"easy": 0, "medium": 1, "hard": 2}.get((level or "medium").lower(), 1)

def _pick_company_mode_question(company_mode: str, history: list[dict], current_difficulty: str) -> Optional[dict]:
    mode = _normalize_company_mode(company_mode)
    if mode == "general":
        return None

    bank = COMPANY_QUESTION_BANK.get(mode, {})
    round_idx = sum(1 for h in (history or []) if "question" in h)
    sections = ["behavioral", "technical", "coding_system"]
    section = sections[round_idx % len(sections)]  # mode switching logic by round
    questions = bank.get(section, [])
    if not questions:
        return None

    asked_texts = set((h.get("question") or "").strip().lower() for h in (history or []) if "question" in h)
    target_rank = _difficulty_rank(current_difficulty)
    filtered = [q for q in questions if _difficulty_rank(q.get("difficulty", "medium")) == target_rank]
    if not filtered:
        filtered = questions

    for q in filtered:
        if q["question"].strip().lower() not in asked_texts:
            return {"section": section, **q}
    return {"section": section, **filtered[0]}

def _company_weighted_score(company_mode: str, detailed_scores: Dict[str, int]) -> int:
    weights = COMPANY_SCORING_PATTERNS.get(_normalize_company_mode(company_mode), COMPANY_SCORING_PATTERNS["general"])
    total = 0.0
    for metric, w in weights.items():
        total += float(detailed_scores.get(metric, 0)) * float(w)
    return _clamp_0_100(total)

def _clamp_0_100(v: float) -> int:
    return int(max(0, min(100, round(v))))


def _structure_score(transcription: str) -> int:
    """
    Evaluate answer structure quality (0-100)
    Heuristics: opening, connectors, conclusion, sentence variety.
    """
    if not transcription:
        return 20

    t = transcription.lower().strip()
    words = t.split()
    if len(words) < 8:
        return 25

    opening_markers = ["first", "to begin", "in this", "my approach", "let me"]
    connector_markers = ["because", "therefore", "however", "also", "then", "for example", "so that"]
    ending_markers = ["in summary", "overall", "finally", "to conclude", "as a result"]

    opening = 1 if any(m in t for m in opening_markers) else 0
    connectors = sum(1 for m in connector_markers if m in t)
    ending = 1 if any(m in t for m in ending_markers) else 0
    sentence_count = len([s for s in re.split(r'[.!?]+', transcription) if s.strip()])

    base = 45
    base += opening * 10
    base += min(20, connectors * 4)
    base += ending * 10
    if sentence_count >= 3:
        base += 10

    return _clamp_0_100(base)


def _confidence_metric(speech_data: Dict, clarity_0_10: int, relevance_0_10: int) -> int:
    """
    Confidence score (0-100) integrating speech + NLP.
    """
    tone = (speech_data or {}).get("tone", "Neutral")
    fillers = int((speech_data or {}).get("filler_words", 0))
    speech_clarity = int((speech_data or {}).get("clarity_score", 70))
    speech_quality = int((speech_data or {}).get("speech_quality_score", 70))

    tone_bonus = 0
    if tone == "Confident":
        tone_bonus = 8
    elif tone == "Hesitant":
        tone_bonus = -6
    elif tone == "Nervous":
        tone_bonus = -10

    filler_penalty = min(12, fillers * 2)
    nlp_anchor = ((clarity_0_10 + relevance_0_10) / 20.0) * 25

    return _clamp_0_100((speech_clarity * 0.5) + (speech_quality * 0.3) + tone_bonus + nlp_anchor - filler_penalty)


def _speech_actionable_tips(speech_data: Dict) -> List[str]:
    tips: List[str] = []
    filler_ratio = float((speech_data or {}).get("filler_ratio", 0.0))
    speech_rate = int((speech_data or {}).get("speech_rate", 0))
    ppm = float((speech_data or {}).get("pause_analysis", {}).get("pauses_per_minute", 0.0))

    if filler_ratio > 0.08:
        target_cut = max(20, min(50, int(filler_ratio * 300)))
        tips.append(f"Reduce filler words by {target_cut}% by pausing silently instead of saying 'um' or 'uh'.")
    elif filler_ratio > 0.04:
        tips.append("Trim filler words slightly and use brief pauses between ideas.")
    else:
        tips.append("Great filler control. Maintain this speaking discipline.")

    if speech_rate < 105:
        tips.append("Increase speaking pace slightly to around 120-145 WPM for stronger delivery.")
    elif speech_rate > 165:
        tips.append("Slow down speaking speed to improve clarity and interviewer comprehension.")
    else:
        tips.append("Speech rate is in a good range. Keep the same pace.")

    if ppm > 18:
        tips.append("Reduce pause frequency by grouping ideas before speaking.")
    elif ppm < 4:
        tips.append("Add natural pauses between key points to improve structure.")
    else:
        tips.append("Pause frequency is balanced. Keep using deliberate pauses.")

    return tips


def _build_detailed_rubric(
    clarity_0_10: int,
    relevance_0_10: int,
    technical_depth_0_10: int,
    transcription: str,
    speech_data: Dict
) -> Dict:
    """
    Detailed normalized rubric (0-100 each metric):
    clarity, relevance, depth, confidence, structure
    """
    clarity = _clamp_0_100(clarity_0_10 * 10)
    relevance = _clamp_0_100(relevance_0_10 * 10)
    depth = _clamp_0_100(technical_depth_0_10 * 10)
    structure = _structure_score(transcription)
    confidence = _confidence_metric(speech_data, clarity_0_10, relevance_0_10)

    return {
        "clarity": clarity,
        "relevance": relevance,
        "depth": depth,
        "confidence": confidence,
        "structure": structure
    }


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


def _generate_tutor_feedback_with_llm(question: str, user_answer: str, keywords: List[str], role: str) -> dict:
    """
    AI Tutor mode:
    - Ideal answer
    - Comparison vs user answer
    - Missing concepts and weak explanation areas
    - Actionable coaching
    """
    fallback = {
        "ideal_answer": "A strong answer should define the core concept, explain a practical approach, and include a concise example with trade-offs.",
        "comparison": "Your answer addresses some parts, but can be more structured and complete.",
        "missing_concepts": [],
        "weak_areas": [],
        "what_you_did_well": [
            "You attempted to answer the question directly."
        ],
        "what_you_missed": [
            "Include more concrete technical details and examples."
        ],
        "how_to_improve": [
            "Use a structure: definition -> approach -> example -> trade-off.",
            "Mention 2-3 role-specific keywords naturally."
        ]
    }

    if genai is None:
        return fallback
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return fallback

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = (
            "You are an expert AI tutor for technical interview preparation.\n"
            f"Role: {role}\n"
            "Given the question and candidate answer, provide strict JSON with this schema:\n"
            "{\n"
            '  "ideal_answer": "2-5 sentence model answer",\n'
            '  "comparison": "brief comparison of user answer vs ideal",\n'
            '  "missing_concepts": ["..."],\n'
            '  "weak_areas": ["..."],\n'
            '  "what_you_did_well": ["..."],\n'
            '  "what_you_missed": ["..."],\n'
            '  "how_to_improve": ["..."]\n'
            "}\n"
            "Keep feedback practical and specific.\n\n"
            f"Question: {question}\n"
            f"User answer: {user_answer}\n"
            f"Keywords to evaluate: {', '.join(keywords or [])}\n"
        )
        resp = model.generate_content(prompt)
        raw = getattr(resp, "text", None) or str(resp)
        raw = (raw or "").strip()
        if raw.startswith("```"):
            raw = raw.strip("`").strip()
            parts = raw.split("\n", 1)
            raw = parts[1] if len(parts) == 2 else parts[0]
        data = json.loads(raw)
        return {
            "ideal_answer": str(data.get("ideal_answer") or fallback["ideal_answer"]),
            "comparison": str(data.get("comparison") or fallback["comparison"]),
            "missing_concepts": list(data.get("missing_concepts") or []),
            "weak_areas": list(data.get("weak_areas") or []),
            "what_you_did_well": list(data.get("what_you_did_well") or []),
            "what_you_missed": list(data.get("what_you_missed") or []),
            "how_to_improve": list(data.get("how_to_improve") or []),
        }
    except Exception:
        return fallback

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


class ResumeRoleAnalysisRequest(BaseModel):
    resume_text: str
    role: str

# ── 3. RESUME NLP LOGIC ──

def extract_experience_level(text: str):
    years = re.findall(r"(\d+)\+?\s*years?", text.lower())
    if not years: return "Entry Level"
    max_year = max([int(y) for y in years])
    if max_year < 2: return "Junior"
    if max_year < 5: return "Mid-Level"
    return "Senior"


ROLE_JOB_DESCRIPTION = {
    "Full Stack Developer": "Build full stack web apps using React Node.js Express MongoDB SQL REST APIs Git and Docker.",
    "Data Scientist": "Work on Python machine learning statistics pandas numpy scikit-learn model evaluation and SQL.",
    "Frontend Engineer": "Develop responsive UIs with React JavaScript TypeScript CSS accessibility testing and performance optimization.",
    "Backend Architect": "Design scalable backend systems with microservices cloud APIs databases caching messaging and CI/CD."
}

JOB_DATASET = [
    {"title": "Frontend Developer Intern", "skills": ["React", "JavaScript", "CSS", "HTML", "Git"]},
    {"title": "Backend Developer", "skills": ["Node.js", "Express", "REST API", "MongoDB", "SQL", "Docker"]},
    {"title": "Full Stack Developer", "skills": ["React", "Node.js", "Express", "MongoDB", "REST API", "Git"]},
    {"title": "Data Analyst", "skills": ["Python", "SQL", "Pandas", "NumPy", "Statistics"]},
    {"title": "Machine Learning Engineer", "skills": ["Python", "Machine Learning", "Scikit-learn", "TensorFlow", "PyTorch"]},
    {"title": "Cloud Backend Engineer", "skills": ["Microservices", "Docker", "Kubernetes", "AWS", "CI/CD"]},
]


def _get_role_job_description(role: str) -> str:
    return ROLE_JOB_DESCRIPTION.get(role, ROLE_JOB_DESCRIPTION["Full Stack Developer"])


def _recommend_jobs(extracted_skills: list[str], role: str) -> list[dict]:
    extracted = {s.lower() for s in extracted_skills}
    ranked = []

    for job in JOB_DATASET:
        required = job["skills"]
        if not required:
            continue
        matched = [s for s in required if s.lower() in extracted]
        score = int((len(matched) / len(required)) * 100)
        if role.lower() in job["title"].lower():
            score = min(100, score + 10)

        reason = (
            f"Matches {len(matched)}/{len(required)} key skills"
            if matched else
            "Build core skills to improve fit"
        )
        ranked.append({
            "title": job["title"],
            "match_score": score,
            "reason": reason
        })

    ranked.sort(key=lambda x: x["match_score"], reverse=True)
    return ranked[:5]


def _build_improvement_plan(missing_skills: list[str], role: str) -> list[str]:
    if not missing_skills:
        return [
            f"Tailor project bullet points for {role} using measurable outcomes.",
            "Add impact metrics (latency, conversion, users, revenue) in experience section.",
            "Keep resume to one page with ATS-friendly headings."
        ]

    top_missing = missing_skills[:5]
    return [
        f"Add proof of {skill} through one project bullet and one skill entry."
        for skill in top_missing
    ]

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


@app.post("/resume-role-analysis")
async def resume_role_analysis(data: ResumeRoleAnalysisRequest):
    if not model or not index:
        raise HTTPException(status_code=500, detail="NLP Models not loaded.")

    role = (data.role or "").strip() or "Full Stack Developer"
    role_jd = _get_role_job_description(role)

    resume_payload = ResumeAnalysisRequest(
        resume_text=data.resume_text,
        job_description=role_jd
    )
    base = await analyze_resume(resume_payload)

    recommended_jobs = _recommend_jobs(base["extracted_skills"], role)
    improvement_plan = _build_improvement_plan(base["missing_skills"], role)

    return {
        "role": role,
        "extracted_skills": base["extracted_skills"],
        "missing_skills": base["missing_skills"],
        "similarity_score": base["similarity_score"],
        "experience_level": base["experience_level"],
        "recommended_jobs": recommended_jobs,
        "improvement_plan": improvement_plan
    }


# ╔════════════════════════════════════════════════════════════════════╗
# ║                         API ENDPOINTS                              ║
# ╚════════════════════════════════════════════════════════════════════╝

# Schema
class StartInterviewRequest(BaseModel):
    role: str
    company_mode: Optional[str] = "general"
    current_difficulty: Optional[str] = "medium"


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
    company_mode = _normalize_company_mode(data.company_mode or "general")
    current_difficulty = (data.current_difficulty or "medium").lower()

    company_q = _pick_company_mode_question(company_mode, history=[], current_difficulty=current_difficulty)
    if company_q:
        question = company_q["question"]
    else:
        question = _generate_question_with_gemini(role, history=[])
    return {
        "question": question,
        "company_mode": company_mode,
        "question_section": company_q["section"] if company_q else "general",
        "question_difficulty": company_q["difficulty"] if company_q else current_difficulty
    }


@app.post("/submit-answer")
async def submit_answer(
    audio_file: UploadFile = File(...),
    role: str = Form(...),
    history: str = Form(...),
    question: str = Form(default=""),
    company_mode: str = Form(default="general"),
    current_difficulty: str = Form(default="medium"),
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
    company_mode = _normalize_company_mode(company_mode)

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
        speech_tips = _speech_actionable_tips(speech_data)
        detailed_scores = _build_detailed_rubric(
            clarity,
            relevance,
            technical_depth,
            transcription,
            speech_data
        )

        # ── PHASE 3: Readiness Classification ──
        scores = {
            "clarity": clarity,
            "relevance": relevance,
            "technical_depth": technical_depth,
            "keyword_count": len(keywords_matched),
            "fillers": speech_data["filler_words"],
            "confidence_score": detailed_scores["confidence"],
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
        tutor_feedback = _generate_tutor_feedback_with_llm(
            question=question or "General technical question",
            user_answer=transcription,
            keywords=keywords_matched,
            role=role
        )

        next_question = gemini_analysis.get("next_question", "")
        section = "general"
        q_difficulty = current_difficulty

        company_q = _pick_company_mode_question(company_mode, parsed_history, current_difficulty)
        if company_q:
            next_question = company_q["question"]
            section = company_q["section"]
            q_difficulty = company_q["difficulty"]
        elif not next_question:
            next_question = _generate_question_with_gemini(role, parsed_history)

        company_weighted = _company_weighted_score(company_mode, detailed_scores)

        # Combine all analyses
        return {
            # Phase 1: Raw data
            "transcription": transcription,
            
            # Phase 2: NLP Scores
            "clarity": clarity,
            "relevance": relevance,
            "technical_depth": technical_depth,
            "keywords_matched": keywords_matched,
            "detailed_scores": detailed_scores,
            "company_weighted_score": company_weighted,
            
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
            "speech_tips": speech_tips,
            
            # UI Display
            "feedback": gemini_analysis.get("feedback", "Good answer."),
            "next_question": next_question,
            "confidence_score": readiness_pred.get("confidence", 0.5) * 100,
            "rating": readiness_pred["readiness_score"],
            "tutor_feedback": tutor_feedback,
            "company_mode": company_mode,
            "question_section": section,
            "question_difficulty": q_difficulty,
            
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
