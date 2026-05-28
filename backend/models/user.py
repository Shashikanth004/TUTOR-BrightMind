from sqlalchemy import Column, Integer, String, DateTime, Text, Float, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    class_level = Column(Integer, default=5)  # 1-12
    avatar = Column(String(10), default="🎓")
    streak_days = Column(Integer, default=0)
    last_active = Column(DateTime, default=datetime.utcnow)
    daily_goal_minutes = Column(Integer, default=30)
    total_xp = Column(Integer, default=0)
    preferences = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    sessions = relationship("LearningSession", back_populates="user")
    quiz_attempts = relationship("QuizAttempt", back_populates="user")
    progress_records = relationship("Progress", back_populates="user")
