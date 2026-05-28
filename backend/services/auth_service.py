import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional
import json

SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_hex(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days

def hash_password(password: str) -> str:
    salt = "ai_tutor_salt_2024"
    return hashlib.sha256(f"{password}{salt}".encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_access_token(data: dict) -> str:
    """Simple JWT-like token (base64 encoded JSON for simplicity)"""
    import base64
    payload = {**data, "exp": (datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)).isoformat()}
    token_data = json.dumps(payload)
    token = base64.b64encode(token_data.encode()).decode()
    # Sign it
    sig = hashlib.sha256(f"{token}{SECRET_KEY}".encode()).hexdigest()[:16]
    return f"{token}.{sig}"

def decode_access_token(token: str) -> Optional[dict]:
    import base64
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        token_data, sig = parts
        expected_sig = hashlib.sha256(f"{token_data}{SECRET_KEY}".encode()).hexdigest()[:16]
        if sig != expected_sig:
            return None
        payload = json.loads(base64.b64decode(token_data).decode())
        if datetime.fromisoformat(payload["exp"]) < datetime.utcnow():
            return None
        return payload
    except:
        return None

def get_current_user_id(token: str) -> Optional[int]:
    payload = decode_access_token(token)
    if payload:
        return payload.get("user_id")
    return None
