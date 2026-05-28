from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.progress import Progress, DailyActivity
from models.quiz import QuizAttempt
from models.session import LearningSession
from schemas import UserResponse
from services.auth_service import decode_access_token
from datetime import datetime, date, timedelta
from typing import Optional
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

@router.get("/")
def get_dashboard(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_user_from_token(authorization, db)
    
    today = date.today().isoformat()
    
    # Today's activity
    today_activity = db.query(DailyActivity).filter(
        DailyActivity.user_id == user.id,
        DailyActivity.date == today
    ).first()
    
    today_minutes = today_activity.minutes_studied if today_activity else 0
    
    # Weekly XP (last 7 days)
    weekly_xp = []
    for i in range(6, -1, -1):
        day = (date.today() - timedelta(days=i)).isoformat()
        activity = db.query(DailyActivity).filter(
            DailyActivity.user_id == user.id,
            DailyActivity.date == day
        ).first()
        weekly_xp.append(activity.xp_earned if activity else 0)
    
    # Recent progress by subject
    progress_records = db.query(Progress).filter(
        Progress.user_id == user.id
    ).order_by(Progress.last_studied.desc()).limit(10).all()
    
    recent_subjects = []
    seen_subjects = set()
    for p in progress_records:
        if p.subject not in seen_subjects:
            seen_subjects.add(p.subject)
            recent_subjects.append({
                "subject": p.subject,
                "chapter": p.chapter,
                "completion": p.completion_percentage,
                "mastery": p.mastery_level,
                "last_studied": p.last_studied.isoformat() if p.last_studied else None
            })
    
    # Weak areas
    all_weak = []
    for p in progress_records:
        for weak in (p.weak_subtopics or []):
            all_weak.append({
                "topic": weak,
                "subject": p.subject,
                "chapter": p.chapter
            })
    
    # Recent quiz scores
    recent_quizzes = db.query(QuizAttempt).filter(
        QuizAttempt.user_id == user.id,
        QuizAttempt.is_completed == True
    ).order_by(QuizAttempt.completed_at.desc()).limit(5).all()
    
    quiz_history = [{
        "subject": q.subject,
        "chapter": q.chapter,
        "score": q.score,
        "type": q.quiz_type,
        "date": q.completed_at.isoformat() if q.completed_at else None
    } for q in recent_quizzes]
    
    # Upcoming revisions (chapters not studied in 3+ days)
    three_days_ago = datetime.utcnow() - timedelta(days=3)
    due_revisions = db.query(Progress).filter(
        Progress.user_id == user.id,
        Progress.last_studied < three_days_ago,
        Progress.completion_percentage > 0
    ).order_by(Progress.last_studied.asc()).limit(5).all()
    
    upcoming_revisions = [{
        "subject": p.subject,
        "chapter": p.chapter,
        "days_since": (datetime.utcnow() - p.last_studied).days if p.last_studied else 0
    } for p in due_revisions]
    
    # Overall progress
    all_progress = db.query(Progress).filter(Progress.user_id == user.id).all()
    overall_pct = 0
    if all_progress:
        overall_pct = sum(p.completion_percentage for p in all_progress) / len(all_progress)
    
    # Achievements
    achievements = compute_achievements(user, all_progress, recent_quizzes)
    
    # Active sessions
    active_sessions = db.query(LearningSession).filter(
        LearningSession.user_id == user.id,
        LearningSession.status == "active"
    ).order_by(LearningSession.last_activity.desc()).limit(3).all()
    
    active_sessions_data = [{
        "id": s.id,
        "subject": s.subject,
        "chapter": s.chapter,
        "phase": s.teaching_phase,
        "last_activity": s.last_activity.isoformat() if s.last_activity else None
    } for s in active_sessions]
    
    return {
        "user": UserResponse.from_orm(user),
        "streak": user.streak_days,
        "today_minutes": round(today_minutes, 1),
        "today_goal": user.daily_goal_minutes,
        "weekly_xp": weekly_xp,
        "recent_subjects": recent_subjects,
        "weak_areas": all_weak[:5],
        "upcoming_revisions": upcoming_revisions,
        "quiz_history": quiz_history,
        "achievements": achievements,
        "overall_progress": round(overall_pct, 1),
        "active_sessions": active_sessions_data,
        "total_chapters_started": len(all_progress),
        "total_quizzes": len(recent_quizzes)
    }

def compute_achievements(user: User, progress_list, quizzes) -> list:
    achievements = []
    
    if user.streak_days >= 7:
        achievements.append({"title": "Week Warrior", "icon": "🔥", "description": f"{user.streak_days} day streak!"})
    if user.total_xp >= 100:
        achievements.append({"title": "XP Hunter", "icon": "⭐", "description": f"{user.total_xp} XP earned"})
    
    completed_chapters = [p for p in progress_list if p.completion_percentage >= 100]
    if len(completed_chapters) >= 1:
        achievements.append({"title": "Chapter Champion", "icon": "🏆", "description": f"{len(completed_chapters)} chapters completed"})
    
    perfect_quizzes = [q for q in quizzes if q.score and q.score >= 90]
    if perfect_quizzes:
        achievements.append({"title": "Quiz Genius", "icon": "🧠", "description": "Scored 90%+ in a quiz"})
    
    mastered = [p for p in progress_list if p.mastery_level == "mastered"]
    if mastered:
        achievements.append({"title": "Topic Master", "icon": "🎓", "description": f"Mastered {len(mastered)} topics"})
    
    return achievements

@router.get("/progress")
def get_progress(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_user_from_token(authorization, db)
    
    progress_records = db.query(Progress).filter(
        Progress.user_id == user.id
    ).all()
    
    # Group by subject
    by_subject = {}
    for p in progress_records:
        if p.subject not in by_subject:
            by_subject[p.subject] = {"chapters": [], "avg_completion": 0}
        by_subject[p.subject]["chapters"].append({
            "chapter": p.chapter,
            "completion": p.completion_percentage,
            "mastery": p.mastery_level,
            "best_score": p.best_quiz_score,
            "study_minutes": p.total_study_minutes,
            "weak_areas": p.weak_subtopics or []
        })
    
    # Calculate averages
    for subj, data in by_subject.items():
        if data["chapters"]:
            data["avg_completion"] = sum(c["completion"] for c in data["chapters"]) / len(data["chapters"])
    
    return {"progress_by_subject": by_subject, "total_records": len(progress_records)}

@router.get("/activity")
def get_activity(
    days: int = 30,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_user_from_token(authorization, db)
    
    start = (date.today() - timedelta(days=days)).isoformat()
    activities = db.query(DailyActivity).filter(
        DailyActivity.user_id == user.id,
        DailyActivity.date >= start
    ).order_by(DailyActivity.date.asc()).all()
    
    return [{
        "date": a.date,
        "minutes": round(a.minutes_studied or 0, 1),
        "topics": a.topics_completed or 0,
        "quizzes": a.quizzes_taken or 0,
        "xp": a.xp_earned or 0
    } for a in activities]
