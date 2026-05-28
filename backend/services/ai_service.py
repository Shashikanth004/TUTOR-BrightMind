import os
from dotenv import load_dotenv
load_dotenv()
import json
import httpx
from typing import List, Dict, Optional
import asyncio

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

async def call_gemini(prompt: str, system_prompt: str = "", temperature: float = 0.7) -> str:
    """Call Google Gemini API (free tier)"""
    if not GEMINI_API_KEY:
        return await call_groq(prompt, system_prompt, temperature)
    
    full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
    
    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": 2048,
        }
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            json=payload
        )
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]

async def call_groq(prompt: str, system_prompt: str = "", temperature: float = 0.7) -> str:
    """Call Groq API (free tier fallback)"""
    if not GROQ_API_KEY:
        return "AI service not configured. Please set GEMINI_API_KEY or GROQ_API_KEY."
    
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": temperature,
        "max_tokens": 2048
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json=payload
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]

async def generate_text(prompt: str, system_prompt: str = "", temperature: float = 0.7) -> str:
    """Main AI generation function with fallback"""
    try:
        return await call_gemini(prompt, system_prompt, temperature)
    except Exception as e:
        print(f"Gemini failed: {e}, trying Groq...")
        try:
            return await call_groq(prompt, system_prompt, temperature)
        except Exception as e2:
            print(f"Groq also failed: {e2}")
            return "I'm having trouble connecting to the AI service right now. Please check your API keys."

# ============ SYSTEM PROMPTS ============

TEACHING_SYSTEM_PROMPT = """You are BrightMind, an expert CBSE AI tutor for Indian students (Class 1-12).
Your teaching style is:
- Age-appropriate, warm, encouraging, and patient
- Use simple language for lower classes, progressively complex for higher
- Always use Indian context examples (cricket, festivals, food, local scenarios)
- Structure every response with clear sections
- Use emojis sparingly but effectively for engagement
- Never skip steps or assume prior knowledge
- Always check understanding before moving forward
- Detect confusion signals and proactively re-explain

Teaching Flow per chapter:
1. INTRO: Engage curiosity, connect to prior knowledge, give overview
2. TOPIC: Teach one concept at a time, clear definitions, step-by-step
3. EXAMPLES: 2-3 worked examples with increasing complexity
4. MINI-PRACTICE: 2-3 simple questions to check understanding
5. MINI-REVISION: Quick recap before moving to next topic

Response Format (use markdown):
- Use **bold** for key terms
- Use numbered lists for steps
- Use bullet points for facts
- Include "🤔 Quick Check:" for comprehension questions
- Include "💡 Remember:" for key takeaways
- End teaching segments with "Ready for the next part? (yes/more examples/doubt)" """

QUIZ_SYSTEM_PROMPT = """You are a CBSE exam expert generating quiz questions for Indian students.
Generate questions that are:
- Accurate to CBSE curriculum and exam patterns
- Age and class appropriate
- Never repeated from previous attempts
- Varied in difficulty (easy 30%, medium 50%, hard 20%)
- Include NCERT-style questions

Output ONLY valid JSON, no extra text. Format:
{
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": "A",
      "explanation": "...",
      "topic": "...",
      "difficulty": "easy|medium|hard"
    }
  ]
}
Types: mcq (4 options), fill (blank answer), tf (true/false), short (1-2 sentence answer)"""

NOTES_SYSTEM_PROMPT = """You are a CBSE curriculum expert creating comprehensive study notes.
Create notes that are:
- Aligned with NCERT textbooks
- Student-friendly with clear explanations
- Include all important definitions, formulas, theorems
- Use Indian context and examples
- Suitable for exam preparation

Output format (markdown):
# Chapter Title
## Key Concepts
## Important Definitions  
## Formulas/Theorems (if applicable)
## Solved Examples
## Key Points to Remember
## Common Mistakes to Avoid
## Memory Tricks (mnemonics)"""

# ============ AI FUNCTIONS ============

async def get_chapter_subtopics(class_level: int, subject: str, chapter: str) -> List[str]:
    """Extract all subtopics for sequential teaching"""
    prompt = f"""List all subtopics for teaching this CBSE chapter sequentially.
Class: {class_level}, Subject: {subject}, Chapter: {chapter}

Return ONLY a JSON array of subtopic strings, ordered for sequential teaching.
Example: ["Introduction to Fractions", "Types of Fractions", "Adding Fractions", ...]

Keep to 6-10 subtopics. Be specific to NCERT curriculum."""
    
    response = await generate_text(prompt, temperature=0.3)
    try:
        # Clean response
        clean = response.strip()
        if "```" in clean:
            clean = clean.split("```")[1].replace("json", "").strip()
        return json.loads(clean)
    except:
        return [f"Introduction to {chapter}", f"Core Concepts of {chapter}", 
                f"Applications of {chapter}", f"Summary and Review"]

async def teach_subtopic(
    class_level: int, subject: str, chapter: str, subtopic: str,
    phase: str, chat_history: List[Dict], student_message: str = "",
    action: str = None
) -> Dict:
    """Generate teaching content for a specific subtopic and phase"""
    
    history_text = ""
    if chat_history:
        recent = chat_history[-6:]
        history_text = "\n".join([f"{m['role'].upper()}: {m['content'][:200]}" for m in recent])
    
    action_instructions = {
        "ask_doubt": "Answer the student's doubt clearly and return to the teaching flow.",
        "explain_again": "Re-explain the last concept using different words and a new example.",
        "simplify": "Explain the concept in the simplest possible terms with very basic examples.",
        "example": "Provide 2-3 real-life examples from everyday Indian life to illustrate the concept.",
        "diagram": "Create a text-based ASCII diagram or structured visual representation of the concept."
    }
    
    action_text = f"\n\nSPECIAL ACTION: {action_instructions.get(action, '')}" if action else ""
    
    prompt = f"""
Class: {class_level} | Subject: {subject} | Chapter: {chapter} | Subtopic: {subtopic}
Teaching Phase: {phase}
{f'Recent conversation:{chr(10)}{history_text}' if history_text else ''}
{f'Student message: {student_message}' if student_message else ''}
{action_text}

Teach this subtopic for the {phase} phase. Be age-appropriate for Class {class_level}.
After teaching, ask if they're ready to continue or need clarification.
"""
    
    response = await generate_text(prompt, TEACHING_SYSTEM_PROMPT, temperature=0.7)
    
    suggestions = ["I understand, continue! ✅", "Explain again 🔄", "Give an example 💡", "I have a doubt 🤔"]
    if phase == "practice":
        suggestions = ["Submit answer", "Need a hint 💭", "Skip this ⏭️", "Explain again 🔄"]
    elif phase == "revision":
        suggestions = ["Done! Next topic ➡️", "Review more 📖", "Take quiz 📝"]
    
    return {
        "response": response,
        "phase": phase,
        "subtopic": subtopic,
        "suggestions": suggestions,
        "progress": 0,
        "can_proceed": True
    }

async def generate_quiz_questions(
    class_level: int, subject: str, chapter: str, quiz_type: str,
    count: int, difficulty: str, weak_areas: List[str] = None,
    used_question_ids: List[int] = None, topic: str = None
) -> List[Dict]:
    """Generate unique quiz questions using AI"""
    
    min_counts = {"practice": 10, "final": 20, "revision": 5}
    actual_count = max(count, min_counts.get(quiz_type, 10))
    
    weak_focus = f"\nFocus more questions on these weak areas: {', '.join(weak_areas)}" if weak_areas else ""
    topic_focus = f"\nFocus on topic: {topic}" if topic else ""
    
    prompt = f"""Generate {actual_count} unique quiz questions for CBSE exam.
Class: {class_level} | Subject: {subject} | Chapter: {chapter}
Quiz Type: {quiz_type} | Difficulty: {difficulty}
{weak_focus}{topic_focus}

Include mix: 40% MCQ, 25% Fill-in-blank, 20% True/False, 15% Short Answer
For {quiz_type} quiz, ensure questions match CBSE exam pattern.
ALL questions must be unique and cover different aspects of the chapter.

Return ONLY the JSON object, no markdown, no extra text."""
    
    response = await generate_text(prompt, QUIZ_SYSTEM_PROMPT, temperature=0.8)
    
    try:
        clean = response.strip()
        if "```" in clean:
            clean = clean.split("```")[1].replace("json", "").strip()
        data = json.loads(clean)
        questions = data.get("questions", [])
        # Ensure IDs are unique
        for i, q in enumerate(questions):
            q["id"] = f"q_{i+1}"
        return questions
    except Exception as e:
        print(f"Quiz parse error: {e}")
        return []

async def generate_notes(class_level: int, subject: str, chapter: str, topic: str = None, style: str = "detailed") -> Dict:
    """Generate comprehensive study notes"""
    
    focus = f" focusing on {topic}" if topic else ""
    style_instruction = {
        "brief": "Create concise bullet-point notes, max 300 words",
        "detailed": "Create comprehensive notes with examples, 500-800 words",
        "visual": "Create visual/structured notes with tables, diagrams, and charts"
    }.get(style, "detailed")
    
    prompt = f"""Create {style} CBSE study notes for:
Class: {class_level} | Subject: {subject} | Chapter: {chapter}{focus}

{style_instruction}

Include key_points (list of 5-8 bullet points), formulas (list, empty if none), 
and memory_tricks (list of 2-3 mnemonics or tricks)."""
    
    response = await generate_text(prompt, NOTES_SYSTEM_PROMPT, temperature=0.5)
    
    # Extract key points, formulas, memory tricks from response
    key_points = []
    formulas = []
    memory_tricks = []
    
    lines = response.split('\n')
    current_section = None
    
    for line in lines:
        line = line.strip()
        if 'key point' in line.lower() or 'remember' in line.lower():
            current_section = 'key'
        elif 'formula' in line.lower() or 'theorem' in line.lower():
            current_section = 'formula'
        elif 'trick' in line.lower() or 'mnemonic' in line.lower():
            current_section = 'trick'
        elif line.startswith('- ') or line.startswith('• ') or (line.startswith('*') and not line.startswith('**')):
            content = line.lstrip('- •*').strip()
            if current_section == 'key' and len(key_points) < 8:
                key_points.append(content)
            elif current_section == 'formula' and len(formulas) < 10:
                formulas.append(content)
            elif current_section == 'trick' and len(memory_tricks) < 3:
                memory_tricks.append(content)
    
    if not key_points:
        key_points = [f"Study {chapter} thoroughly from NCERT", "Practice all solved examples", "Revise key definitions"]
    
    return {
        "title": f"Class {class_level} {subject}: {chapter}" + (f" - {topic}" if topic else ""),
        "content": response,
        "key_points": key_points,
        "formulas": formulas,
        "memory_tricks": memory_tricks,
        "source": "ai_generated"
    }

async def evaluate_quiz_answers(questions: List[Dict], answers: Dict[str, str]) -> Dict:
    """Evaluate quiz and provide detailed feedback"""
    
    results = []
    correct = 0
    wrong_topics = []
    
    for q in questions:
        qid = q["id"]
        user_answer = answers.get(qid, "").strip().lower()
        correct_answer = q["correct_answer"].strip().lower()
        
        is_correct = False
        if q["type"] == "tf":
            is_correct = user_answer in correct_answer or correct_answer in user_answer
        elif q["type"] == "mcq":
            is_correct = user_answer == correct_answer or user_answer[0:1] == correct_answer[0:1]
        elif q["type"] == "fill":
            is_correct = any(word in correct_answer for word in user_answer.split() if len(word) > 3)
        else:
            is_correct = len(user_answer) > 5  # Short answer - basic check
        
        if is_correct:
            correct += 1
        else:
            wrong_topics.append(q.get("topic", "General"))
        
        results.append({
            "question_id": qid,
            "correct": is_correct,
            "user_answer": answers.get(qid, ""),
            "correct_answer": q["correct_answer"],
            "explanation": q.get("explanation", "")
        })
    
    total = len(questions)
    percentage = (correct / total * 100) if total > 0 else 0
    
    grade_map = [(90, "A+"), (80, "A"), (70, "B+"), (60, "B"), (50, "C"), (0, "D")]
    grade = next(g for threshold, g in grade_map if percentage >= threshold)
    
    xp = int(percentage * 0.5) + (10 if percentage >= 70 else 0)
    
    from collections import Counter
    weak = list(set(wrong_topics))[:3]
    strong = [q.get("topic") for q in questions if q["id"] not in [r["question_id"] for r in results if not r["correct"]]]
    strong = list(set(strong))[:3]
    
    feedback_prompt = f"Student scored {percentage:.0f}% ({correct}/{total}) on {questions[0].get('topic', 'this')} quiz. Give 2-3 sentences of encouraging, specific feedback."
    feedback = await generate_text(feedback_prompt, temperature=0.7)
    
    return {
        "score": percentage,
        "correct": correct,
        "total": total,
        "percentage": percentage,
        "grade": grade,
        "weak_areas": weak,
        "strong_areas": strong,
        "xp_earned": xp,
        "feedback": feedback,
        "question_results": results
    }
