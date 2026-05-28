from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import init_db
from routers import teaching, quiz, resources, dashboard, auth
from dotenv import load_dotenv
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="AI Tutor Platform",
    description="CBSE AI Tutor for Class 1-12, All Subjects",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000","https://tutor-bright-mind.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(teaching.router, prefix="/api/teach", tags=["teaching"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
app.include_router(resources.router, prefix="/api/resources", tags=["resources"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

@app.get("/")
def root():
    return {"message": "AI Tutor Platform API v1.0", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
