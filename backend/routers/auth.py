from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas import UserCreate, UserLogin, UserResponse, Token
from services.auth_service import hash_password, verify_password, create_access_token, decode_access_token
from datetime import datetime
from typing import Optional

router = APIRouter()

@router.post("/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    avatars = ["🎓", "🚀", "⭐", "🦁", "🐉", "🎯", "🌟", "🦅"]
    import random
    
    user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        class_level=user_data.class_level,
        avatar=random.choice(avatars)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token({"user_id": user.id, "email": user.email})
    return Token(access_token=token, token_type="bearer", user=UserResponse.from_orm(user))

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update streak
    from datetime import date
    today = date.today()
    last = user.last_active.date() if user.last_active else None
    if last and (today - last).days == 1:
        user.streak_days += 1
    elif last and (today - last).days > 1:
        user.streak_days = 1
    elif not last:
        user.streak_days = 1
    user.last_active = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    token = create_access_token({"user_id": user.id, "email": user.email})
    return Token(access_token=token, token_type="bearer", user=UserResponse.from_orm(user))

@router.get("/me", response_model=UserResponse)
def get_me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.from_orm(user)

@router.put("/me/update")
def update_profile(
    name: Optional[str] = None,
    class_level: Optional[int] = None,
    daily_goal_minutes: Optional[int] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if name: user.name = name
    if class_level: user.class_level = class_level
    if daily_goal_minutes: user.daily_goal_minutes = daily_goal_minutes
    db.commit()
    return {"message": "Profile updated successfully"}
