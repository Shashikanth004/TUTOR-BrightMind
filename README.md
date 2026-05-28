# 🎓 BrightMind AI Tutor Platform

A production-ready, full-stack AI Tutor platform for CBSE students (Class 1–12, all subjects).

## ✨ Features

- **Sequential Chapter Teaching** — AI teaches subtopics one by one: Intro → Topic → Examples → Practice → Revision
- **Dynamic Quiz Engine** — MCQ, Fill-in, True/False, Short Answer. Adapts to performance. Never repeats questions.
- **Smart Notes Generator** — AI-generated CBSE-aligned notes with key points, formulas, and memory tricks
- **Web Resource Search** — DuckDuckGo + Wikipedia + curated trusted sites (NCERT, Khan Academy, Byju's)
- **Interactive AI Actions** — Ask Doubt, Explain Again, Simplify, Real Example, Show Diagram
- **Personalized Dashboard** — XP, streaks, weak areas, revision reminders, activity charts
- **Dark Mode** — Full dark/light theme support

---

## 🗂️ Folder Structure

```
ai-tutor/
├── backend/
│   ├── main.py                  # FastAPI app entry
│   ├── database.py              # SQLite/SQLAlchemy setup
│   ├── models/
│   │   ├── user.py
│   │   ├── session.py
│   │   ├── quiz.py
│   │   └── progress.py
│   ├── schemas/
│   │   └── __init__.py          # Pydantic schemas
│   ├── routers/
│   │   ├── auth.py
│   │   ├── teaching.py
│   │   ├── quiz.py
│   │   ├── resources.py
│   │   └── dashboard.py
│   ├── services/
│   │   ├── ai_service.py        # Gemini/Groq AI integration
│   │   ├── search_service.py    # DuckDuckGo + Wikipedia
│   │   └── auth_service.py      # JWT auth
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── pages/
    │   │   ├── Auth.jsx          # Login/Register
    │   │   ├── Dashboard.jsx     # Stats, streaks, progress
    │   │   ├── Learn.jsx         # AI chat tutor
    │   │   ├── Quiz.jsx          # Quiz engine
    │   │   ├── Resources.jsx     # Notes + web search
    │   │   └── Profile.jsx       # User profile + analytics
    │   ├── components/
    │   │   └── Layout/Layout.jsx
    │   ├── store/index.js        # Zustand state
    │   ├── utils/api.js
    │   └── styles/globals.css
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## 🚀 Quick Start

### 1. Get a Free AI API Key

**Option A: Google Gemini (Recommended)**
1. Go to https://aistudio.google.com/
2. Click "Get API Key" → Create API Key
3. Copy your key

**Option B: Groq (Faster, also free)**
1. Go to https://console.groq.com/
2. Sign up → API Keys → Create Key
3. Copy your key

---

### 2. Backend Setup

```bash
cd ai-tutor/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your API key:
# GEMINI_API_KEY=your_key_here
# OR
# GROQ_API_KEY=your_key_here

# Start the server
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

---

### 3. Frontend Setup

```bash
cd ai-tutor/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/teach/start` | Start learning session |
| POST | `/api/teach/chat` | Send message to AI tutor |
| GET | `/api/teach/sessions` | List user sessions |
| POST | `/api/quiz/generate` | Generate quiz questions |
| POST | `/api/quiz/submit/{id}` | Submit quiz answers |
| GET | `/api/quiz/history` | Quiz history |
| GET | `/api/resources/subjects` | Get subjects by class |
| GET | `/api/resources/chapters` | Get chapters for subject |
| GET | `/api/resources/search` | Search web resources |
| GET | `/api/resources/notes` | Generate AI notes |
| GET | `/api/dashboard/` | Dashboard data |
| GET | `/api/dashboard/progress` | Progress by subject |
| GET | `/api/dashboard/activity` | Daily activity data |

---

## 🤖 AI Configuration

The system uses Google Gemini (free tier) with Groq as fallback.

**Optimized prompts for:**
- `TEACHING_SYSTEM_PROMPT` — Sequential, age-appropriate CBSE teaching
- `QUIZ_SYSTEM_PROMPT` — CBSE exam-pattern question generation
- `NOTES_SYSTEM_PROMPT` — NCERT-aligned comprehensive notes

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, Framer Motion |
| State | Zustand |
| Charts | Recharts |
| Backend | Python, FastAPI, Pydantic v2 |
| Database | SQLite + SQLAlchemy |
| AI Engine | Google Gemini API (free) / Groq (free) |
| Search | DuckDuckGo API + Wikipedia API |
| Auth | JWT (custom, no extra deps) |

---

## 📱 Responsive Design

- Mobile-first responsive layout
- Dark/Light mode with CSS variables
- Animated transitions with Framer Motion
- Glass morphism UI design

---

## 📄 License

MIT License — Free to use and modify.
