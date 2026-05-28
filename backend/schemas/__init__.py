from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth Schemas
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    class_level: int = 5

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    class_level: int
    avatar: str
    streak_days: int
    total_xp: int
    daily_goal_minutes: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Teaching Schemas
class StartSessionRequest(BaseModel):
    class_level: int
    subject: str
    chapter: str
    user_id: int

class ChatMessage(BaseModel):
    session_id: int
    message: str
    action: Optional[str] = None  # ask_doubt, explain_again, simplify, example, diagram

class TeachingResponse(BaseModel):
    response: str
    phase: str
    subtopic: Optional[str]
    progress: float
    suggestions: List[str]
    can_proceed: bool

# Quiz Schemas
class QuizGenerateRequest(BaseModel):
    user_id: int
    class_level: int
    subject: str
    chapter: str
    quiz_type: str  # practice, final, revision
    difficulty: Optional[str] = "adaptive"
    topic: Optional[str] = None

class QuizQuestion(BaseModel):
    id: str
    type: str  # mcq, fill, tf, short
    question: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str
    topic: str
    difficulty: str

class QuizSubmitRequest(BaseModel):
    attempt_id: int
    answers: Dict[str, str]
    time_taken_seconds: int

class QuizResult(BaseModel):
    score: float
    correct: int
    total: int
    percentage: float
    grade: str
    weak_areas: List[str]
    strong_areas: List[str]
    xp_earned: int
    feedback: str
    question_results: List[Dict]

# Resource Schemas
class ResourceSearchRequest(BaseModel):
    class_level: int
    subject: str
    chapter: str
    resource_type: Optional[str] = "all"  # youtube, pdf, article, all

class Resource(BaseModel):
    title: str
    url: str
    type: str
    source: str
    description: str
    thumbnail: Optional[str] = None

# Notes Schemas
class NotesRequest(BaseModel):
    class_level: int
    subject: str
    chapter: str
    topic: Optional[str] = None
    style: Optional[str] = "detailed"  # brief, detailed, visual

class NotesResponse(BaseModel):
    title: str
    content: str
    key_points: List[str]
    formulas: List[str]
    memory_tricks: List[str]
    source: str  # ai_generated, web_fetched

# Dashboard Schemas
class DashboardData(BaseModel):
    user: UserResponse
    streak: int
    today_minutes: float
    today_goal: int
    weekly_xp: List[int]
    recent_subjects: List[Dict]
    weak_areas: List[Dict]
    upcoming_revisions: List[Dict]
    achievements: List[Dict]
    overall_progress: float

class ProgressUpdate(BaseModel):
    user_id: int
    class_level: int
    subject: str
    chapter: str
    subtopic: str
    minutes_spent: float
    completed: bool
