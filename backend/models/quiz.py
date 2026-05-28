from sqlalchemy import Column, Integer, String, DateTime, Text, Float, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_level = Column(Integer, nullable=False)
    subject = Column(String(100), nullable=False)
    chapter = Column(String(200), nullable=False)
    quiz_type = Column(String(30), nullable=False)  # practice, final, revision
    questions = Column(JSON, default=list)
    answers = Column(JSON, default=list)
    score = Column(Float, default=0)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    time_taken_seconds = Column(Integer, default=0)
    difficulty = Column(String(20), default="medium")
    weak_areas = Column(JSON, default=list)
    completed_at = Column(DateTime, default=datetime.utcnow)
    is_completed = Column(Boolean, default=False)

    user = relationship("User", back_populates="quiz_attempts")

class QuestionBank(Base):
    __tablename__ = "question_bank"

    id = Column(Integer, primary_key=True, index=True)
    class_level = Column(Integer, nullable=False)
    subject = Column(String(100), nullable=False)
    chapter = Column(String(200), nullable=False)
    topic = Column(String(200))
    question_type = Column(String(20), nullable=False)  # mcq, fill, tf, short
    question = Column(Text, nullable=False)
    options = Column(JSON)
    answer = Column(Text, nullable=False)
    explanation = Column(Text)
    difficulty = Column(String(20), default="medium")
    used_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
