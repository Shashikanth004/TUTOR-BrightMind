from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from models.session import LearningSession
from models.progress import Progress, DailyActivity
from models.user import User
from schemas import StartSessionRequest, ChatMessage
from services.ai_service import get_chapter_subtopics, teach_subtopic
from services.auth_service import decode_access_token
from datetime import datetime, date
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

@router.post("/start")
async def start_session(
    request: StartSessionRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_user_from_token(authorization, db)
    
    # Get chapter subtopics
    subtopics = await get_chapter_subtopics(request.class_level, request.subject, request.chapter)
    
    # Create session
    session = LearningSession(
        user_id=user.id,
        class_level=request.class_level,
        subject=request.subject,
        chapter=request.chapter,
        current_topic=subtopics[0] if subtopics else request.chapter,
        current_subtopic_index=0,
        teaching_phase="intro",
        chat_history=[],
        subtopics_covered=[]
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Get intro teaching content
    intro_response = await teach_subtopic(
        class_level=request.class_level,
        subject=request.subject,
        chapter=request.chapter,
        subtopic=subtopics[0] if subtopics else request.chapter,
        phase="intro",
        chat_history=[]
    )
    
    # Save to chat history
    session.chat_history = [{
        "role": "assistant",
        "content": intro_response["response"],
        "phase": "intro",
        "timestamp": datetime.utcnow().isoformat()
    }]
    
    db.commit()
    
    return {
        "session_id": session.id,
        "subtopics": subtopics,
        "current_subtopic": subtopics[0] if subtopics else request.chapter,
        "total_subtopics": len(subtopics),
        "teaching_response": intro_response,
        "message": "Session started successfully"
    }

@router.post("/chat")
async def chat(
    request: ChatMessage,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_user_from_token(authorization, db)
    
    session = db.query(LearningSession).filter(
        LearningSession.id == request.session_id,
        LearningSession.user_id == user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    chat_history = session.chat_history or []
    
    # Add user message
    chat_history.append({
        "role": "user",
        "content": request.message,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Determine phase progression
    phase = session.teaching_phase
    subtopic_idx = session.current_subtopic_index
    
    # Get subtopics
    subtopics = await get_chapter_subtopics(session.class_level, session.subject, session.chapter)
    current_subtopic = subtopics[subtopic_idx] if subtopic_idx < len(subtopics) else session.chapter
    
    # Check if user wants to proceed
    proceed_signals = ["yes", "continue", "next", "understand", "got it", "ok", "okay", "proceed"]
    user_msg_lower = request.message.lower()
    wants_to_proceed = any(signal in user_msg_lower for signal in proceed_signals)
    
    # Phase progression logic
    phase_order = ["intro", "topic", "example", "practice", "revision"]
    
    if wants_to_proceed and not request.action:
        current_phase_idx = phase_order.index(phase) if phase in phase_order else 0
        if current_phase_idx < len(phase_order) - 1:
            phase = phase_order[current_phase_idx + 1]
        else:
            # Move to next subtopic
            subtopic_idx += 1
            if subtopic_idx < len(subtopics):
                current_subtopic = subtopics[subtopic_idx]
                phase = "intro"
                if current_subtopic not in (session.subtopics_covered or []):
                    covered = session.subtopics_covered or []
                    covered.append(subtopics[subtopic_idx - 1])
                    session.subtopics_covered = covered
            else:
                phase = "completed"
    
    # Generate AI response
    ai_response = await teach_subtopic(
        class_level=session.class_level,
        subject=session.subject,
        chapter=session.chapter,
        subtopic=current_subtopic,
        phase=phase,
        chat_history=chat_history,
        student_message=request.message,
        action=request.action
    )
    
    # Calculate progress
    total = len(subtopics)
    completed = len(session.subtopics_covered or [])
    progress_pct = (completed / total * 100) if total > 0 else 0
    
    ai_response["progress"] = progress_pct
    
    # Save AI response to history
    chat_history.append({
        "role": "assistant",
        "content": ai_response["response"],
        "phase": phase,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Update session
    session.chat_history = chat_history
    session.teaching_phase = phase
    session.current_subtopic_index = subtopic_idx
    session.current_topic = current_subtopic
    session.last_activity = datetime.utcnow()
    
    # Update progress in DB
    update_progress(db, user.id, session, progress_pct, subtopics)
    
    db.commit()
    
    return {
        "response": ai_response["response"],
        "phase": phase,
        "current_subtopic": current_subtopic,
        "subtopic_index": subtopic_idx,
        "total_subtopics": len(subtopics),
        "progress": progress_pct,
        "suggestions": ai_response["suggestions"],
        "subtopics": subtopics
    }

def update_progress(db: Session, user_id: int, session: LearningSession, progress_pct: float, subtopics: List):
    """Update progress records"""
    progress = db.query(Progress).filter(
        Progress.user_id == user_id,
        Progress.class_level == session.class_level,
        Progress.subject == session.subject,
        Progress.chapter == session.chapter
    ).first()
    
    if not progress:
        progress = Progress(
            user_id=user_id,
            class_level=session.class_level,
            subject=session.subject,
            chapter=session.chapter
        )
        db.add(progress)
    
    progress.completion_percentage = progress_pct
    progress.subtopics_completed = session.subtopics_covered or []
    progress.last_studied = datetime.utcnow()
    progress.updated_at = datetime.utcnow()
    
    # Update daily activity
    today = date.today().isoformat()
    activity = db.query(DailyActivity).filter(
        DailyActivity.user_id == user_id,
        DailyActivity.date == today
    ).first()
    
    if not activity:
        activity = DailyActivity(user_id=user_id, date=today)
        db.add(activity)
    
    activity.minutes_studied = (activity.minutes_studied or 0) + 0.5  # approx 30 seconds per message
    subjects = activity.subjects_studied or []
    if session.subject not in subjects:
        subjects.append(session.subject)
        activity.subjects_studied = subjects
    
    db.commit()

@router.get("/session/{session_id}")
def get_session(
    session_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_user_from_token(authorization, db)
    session = db.query(LearningSession).filter(
        LearningSession.id == session_id,
        LearningSession.user_id == user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "id": session.id,
        "class_level": session.class_level,
        "subject": session.subject,
        "chapter": session.chapter,
        "current_topic": session.current_topic,
        "phase": session.teaching_phase,
        "progress": len(session.subtopics_covered or []),
        "chat_history": session.chat_history or [],
        "started_at": session.started_at
    }

@router.get("/sessions")
def list_sessions(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    user = get_user_from_token(authorization, db)
    sessions = db.query(LearningSession).filter(
        LearningSession.user_id == user.id
    ).order_by(LearningSession.last_activity.desc()).limit(10).all()
    
    return [{
        "id": s.id,
        "subject": s.subject,
        "chapter": s.chapter,
        "class_level": s.class_level,
        "phase": s.teaching_phase,
        "last_activity": s.last_activity,
        "status": s.status
    } for s in sessions]

@router.get("/subtopics")
async def get_subtopics(
    class_level: int,
    subject: str,
    chapter: str
):
    subtopics = await get_chapter_subtopics(class_level, subject, chapter)
    return {"subtopics": subtopics, "count": len(subtopics)}
