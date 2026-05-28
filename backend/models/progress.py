from sqlalchemy import Column, Integer, String, DateTime, Text, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_level = Column(Integer, nullable=False)
    subject = Column(String(100), nullable=False)
    chapter = Column(String(200), nullable=False)
    subtopics_completed = Column(JSON, default=list)
    completion_percentage = Column(Float, default=0)
    mastery_level = Column(String(20), default="beginner")  # beginner, developing, proficient, mastered
    best_quiz_score = Column(Float, default=0)
    average_quiz_score = Column(Float, default=0)
    total_study_minutes = Column(Float, default=0)
    weak_subtopics = Column(JSON, default=list)
    strong_subtopics = Column(JSON, default=list)
    last_studied = Column(DateTime, default=datetime.utcnow)
    revision_due = Column(DateTime)
    xp_earned = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="progress_records")

class DailyActivity(Base):
    __tablename__ = "daily_activity"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String(10), nullable=False)  # YYYY-MM-DD
    minutes_studied = Column(Float, default=0)
    topics_completed = Column(Integer, default=0)
    quizzes_taken = Column(Integer, default=0)
    xp_earned = Column(Integer, default=0)
    subjects_studied = Column(JSON, default=list)
