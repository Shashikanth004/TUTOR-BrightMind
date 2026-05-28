from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from schemas import ResourceSearchRequest, NotesRequest
from services.search_service import search_educational_resources
from services.ai_service import generate_notes
from typing import Optional

router = APIRouter()

@router.post("/search")
async def search_resources(request: ResourceSearchRequest):
    """Search for educational resources using DuckDuckGo + trusted sites"""
    resources = await search_educational_resources(
        class_level=request.class_level,
        subject=request.subject,
        chapter=request.chapter,
        resource_type=request.resource_type
    )
    
    total = sum(len(v) for v in resources.values())
    
    return {
        "resources": resources,
        "total": total,
        "query": f"CBSE Class {request.class_level} {request.subject} {request.chapter}"
    }

@router.get("/search")
async def search_resources_get(
    class_level: int,
    subject: str,
    chapter: str,
    resource_type: str = "all"
):
    """GET version of resource search"""
    resources = await search_educational_resources(
        class_level=class_level,
        subject=subject,
        chapter=chapter,
        resource_type=resource_type
    )
    return {
        "resources": resources,
        "total": sum(len(v) for v in resources.values())
    }

@router.post("/notes")
async def get_notes(request: NotesRequest):
    """Generate or fetch study notes"""
    notes = await generate_notes(
        class_level=request.class_level,
        subject=request.subject,
        chapter=request.chapter,
        topic=request.topic,
        style=request.style
    )
    return notes

@router.get("/notes")
async def get_notes_get(
    class_level: int,
    subject: str,
    chapter: str,
    topic: Optional[str] = None,
    style: str = "detailed"
):
    """GET version of notes endpoint"""
    notes = await generate_notes(
        class_level=class_level,
        subject=subject,
        chapter=chapter,
        topic=topic,
        style=style
    )
    return notes

@router.get("/subjects")
def get_subjects(class_level: int):
    """Get all subjects for a given class"""
    subjects_by_class = {
        1: ["Mathematics", "English", "Hindi", "EVS"],
        2: ["Mathematics", "English", "Hindi", "EVS"],
        3: ["Mathematics", "English", "Hindi", "EVS"],
        4: ["Mathematics", "English", "Hindi", "EVS"],
        5: ["Mathematics", "English", "Hindi", "EVS"],
        6: ["Mathematics", "Science", "Social Science", "English", "Hindi", "Sanskrit"],
        7: ["Mathematics", "Science", "Social Science", "English", "Hindi", "Sanskrit"],
        8: ["Mathematics", "Science", "Social Science", "English", "Hindi", "Sanskrit"],
        9: ["Mathematics", "Science", "Social Science", "English", "Hindi", "Sanskrit", "Economics"],
        10: ["Mathematics", "Science", "Social Science", "English", "Hindi", "Sanskrit", "Economics"],
        11: ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English", "Economics", "Accountancy", "Business Studies", "History", "Geography", "Political Science"],
        12: ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English", "Economics", "Accountancy", "Business Studies", "History", "Geography", "Political Science"]
    }
    
    subjects = subjects_by_class.get(class_level, ["Mathematics", "Science", "English", "Hindi"])
    return {"class_level": class_level, "subjects": subjects}

@router.get("/chapters")
async def get_chapters(class_level: int, subject: str):
    """Get chapters for a subject - AI generated based on NCERT"""
    from services.ai_service import generate_text
    
    prompt = f"""List all chapters for CBSE Class {class_level} {subject} (NCERT curriculum).
Return ONLY a JSON array of chapter names in order.
Example: ["Chapter 1: Name", "Chapter 2: Name", ...]
Be accurate to the actual NCERT textbook chapters."""
    
    response = await generate_text(prompt, temperature=0.1)
    
    try:
        import json, re
        # Try to extract JSON
        match = re.search(r'\[.*?\]', response, re.DOTALL)
        if match:
            chapters = json.loads(match.group())
            return {"class_level": class_level, "subject": subject, "chapters": chapters}
    except:
        pass
    
    # Fallback chapters
    fallback = [
        f"Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4", "Chapter 5",
        "Chapter 6", "Chapter 7", "Chapter 8", "Chapter 9", "Chapter 10"
    ]
    return {"class_level": class_level, "subject": subject, "chapters": fallback}
