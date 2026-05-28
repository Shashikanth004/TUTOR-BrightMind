from sqlalchemy import Column, Integer, String, DateTime, Text, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_level = Column(Integer, nullable=False)
    subject = Column(String(100), nullable=False)
    chapter = Column(String(200), nullable=False)
    current_topic = Column(String(200))
    current_subtopic_index = Column(Integer, default=0)
    teaching_phase = Column(String(50), default="intro")  # intro, topic, example, practice, revision
    chat_history = Column(JSON, default=list)
    subtopics_covered = Column(JSON, default=list)
    started_at = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)
    duration_minutes = Column(Float, default=0)
    status = Column(String(20), default="active")  # active, completed, paused

    user = relationship("User", back_populates="sessions")
