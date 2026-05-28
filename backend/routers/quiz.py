from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from models.quiz import QuizAttempt
from models.progress import Progress
from models.user import User
from schemas import QuizGenerateRequest, QuizSubmitRequest
from services.ai_service import generate_quiz_questions, evaluate_quiz_answers
from services.auth_service import decode_access_token
from datetime import datetime
from typing import Optional, List
import json

router = APIRouter()

def get_user_from_token(authorization: Optional[str], db: Session) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/generate")
async def generate_quiz(
    request: QuizGenerateRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_user_from_token(authorization, db)
    
    # Get weak areas for adaptive quiz
    weak_areas = []
    if request.difficulty == "adaptive":
        progress = db.query(Progress).filter(
            Progress.user_id == user.id,
            Progress.subject == request.subject,
            Progress.chapter == request.chapter
        ).first()
        if progress:
            weak_areas = progress.weak_subtopics or []
    
    # Get previously used questions to avoid repetition
    prev_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id,
        QuizAttempt.subject == request.subject,
        QuizAttempt.chapter == request.chapter
    ).order_by(QuizAttempt.completed_at.desc()).limit(5).all()
    
    used_q_ids = []
    for attempt in prev_attempts:
        for q in (attempt.questions or []):
            used_q_ids.append(q.get("id", ""))
    
    # Question counts by type
    counts = {"practice": 10, "final": 20, "revision": 5}
    count = counts.get(request.quiz_type, 10)
    
    # Generate questions
    questions = await generate_quiz_questions(
        class_level=request.class_level,
        subject=request.subject,
        chapter=request.chapter,
        quiz_type=request.quiz_type,
        count=count,
        difficulty=request.difficulty if request.difficulty != "adaptive" else "medium",
        weak_areas=weak_areas,
        used_question_ids=used_q_ids,
        topic=request.topic
    )
    
    if not questions:
        raise HTTPException(status_code=500, detail="Failed to generate questions. Please check AI API keys.")
    
    # Create attempt record
    attempt = QuizAttempt(
        user_id=user.id,
        class_level=request.class_level,
        subject=request.subject,
        chapter=request.chapter,
        quiz_type=request.quiz_type,
        questions=questions,
        answers={},
        total_questions=len(questions),
        difficulty=request.difficulty
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    return {
        "attempt_id": attempt.id,
        "questions": questions,
        "total": len(questions),
        "quiz_type": request.quiz_type,
        "time_limit_minutes": {"practice": 15, "final": 30, "revision": 10}.get(request.quiz_type, 15)
    }

@router.post("/submit/{attempt_id}")
async def submit_quiz(
    attempt_id: int,
    request: QuizSubmitRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_user_from_token(authorization, db)
    
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.user_id == user.id
    ).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found")
    
    if attempt.is_completed:
        raise HTTPException(status_code=400, detail="Quiz already submitted")
    
    # Evaluate answers
    result = await evaluate_quiz_answers(attempt.questions, request.answers)
    
    # Update attempt
    attempt.answers = request.answers
    attempt.score = result["percentage"]
    attempt.correct_answers = result["correct"]
    attempt.weak_areas = result["weak_areas"]
    attempt.time_taken_seconds = request.time_taken_seconds
    attempt.is_completed = True
    attempt.completed_at = datetime.utcnow()
    
    # Update user XP
    user.total_xp += result["xp_earned"]
    
    # Update progress
    progress = db.query(Progress).filter(
        Progress.user_id == user.id,
        Progress.class_level == attempt.class_level,
        Progress.subject == attempt.subject,
        Progress.chapter == attempt.chapter
    ).first()
    
    if not progress:
        progress = Progress(
            user_id=user.id,
            class_level=attempt.class_level,
            subject=attempt.subject,
            chapter=attempt.chapter
        )
        db.add(progress)
    
    # Update scores
    if result["percentage"] > (progress.best_quiz_score or 0):
        progress.best_quiz_score = result["percentage"]
    
    # Calculate average
    prev_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id,
        QuizAttempt.subject == attempt.subject,
        QuizAttempt.chapter == attempt.chapter,
        QuizAttempt.is_completed == True
    ).all()
    
    if prev_attempts:
        scores = [a.score for a in prev_attempts if a.score]
        progress.average_quiz_score = sum(scores) / len(scores)
    
    # Update weak areas
    all_weak = list(set((progress.weak_subtopics or []) + result["weak_areas"]))
    strong = [t for t in (progress.strong_subtopics or []) + result["strong_areas"] if t not in all_weak]
    progress.weak_subtopics = all_weak[:5]
    progress.strong_subtopics = list(set(strong))[:5]
    
    # Set mastery level
    score = result["percentage"]
    if score >= 90:
        progress.mastery_level = "mastered"
    elif score >= 75:
        progress.mastery_level = "proficient"
    elif score >= 60:
        progress.mastery_level = "developing"
    else:
        progress.mastery_level = "beginner"
    
    db.commit()
    
    return result

@router.get("/history")
def get_quiz_history(
    subject: Optional[str] = None,
    chapter: Optional[str] = None,
    limit: int = 20,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_user_from_token(authorization, db)
    
    query = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id,
        QuizAttempt.is_completed == True
    )
    
    if subject:
        query = query.filter(QuizAttempt.subject == subject)
    if chapter:
        query = query.filter(QuizAttempt.chapter == chapter)
    
    attempts = query.order_by(QuizAttempt.completed_at.desc()).limit(limit).all()
    
    return [{
        "id": a.id,
        "subject": a.subject,
        "chapter": a.chapter,
        "quiz_type": a.quiz_type,
        "score": a.score,
        "correct": a.correct_answers,
        "total": a.total_questions,
        "date": a.completed_at,
        "grade": get_grade(a.score or 0)
    } for a in attempts]

def get_grade(score: float) -> str:
    if score >= 90: return "A+"
    if score >= 80: return "A"
    if score >= 70: return "B+"
    if score >= 60: return "B"
    if score >= 50: return "C"
    return "D"

@router.get("/attempt/{attempt_id}")
def get_attempt(
    attempt_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_user_from_token(authorization, db)
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.user_id == user.id
    ).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    return {
        "id": attempt.id,
        "questions": attempt.questions,
        "answers": attempt.answers,
        "score": attempt.score,
        "quiz_type": attempt.quiz_type,
        "is_completed": attempt.is_completed,
        "weak_areas": attempt.weak_areas
    }
