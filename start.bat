@echo off
echo 🎓 BrightMind AI Tutor — Starting...
echo.

if not exist "backend\.env" (
  echo ⚠️  No .env file found. Creating from template...
  copy backend\.env.example backend\.env
  echo 📝 Please edit backend\.env and add your API key
  echo    Get free Gemini key at: https://aistudio.google.com/
  echo.
)

echo 🚀 Starting Backend...
cd backend
if not exist "venv" python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt -q
start "Backend" cmd /k "venv\Scripts\activate && uvicorn main:app --reload --port 8000"
cd ..

echo ⚛️  Starting Frontend...
cd frontend
if not exist "node_modules" npm install
start "Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ✅ Both servers starting...
echo 🌐 Open: http://localhost:5173
echo.
pause
