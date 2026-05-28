#!/bin/bash

echo "🎓 BrightMind AI Tutor — Starting..."
echo ""

# Check if .env exists
if [ ! -f "backend/.env" ]; then
  echo "⚠️  No .env file found. Creating from template..."
  cp backend/.env.example backend/.env
  echo "📝 Please edit backend/.env and add your API key (GEMINI_API_KEY or GROQ_API_KEY)"
  echo "   Get free Gemini key at: https://aistudio.google.com/"
  echo ""
fi

# Start backend
echo "🚀 Starting Backend (FastAPI)..."
cd backend
if [ ! -d "venv" ]; then
  echo "   Creating virtual environment..."
  python -m venv venv
fi

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  source venv/Scripts/activate
else
  source venv/bin/activate
fi

pip install -r requirements.txt -q
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

echo "✅ Backend running at http://localhost:8000"
echo ""

# Start frontend
echo "⚛️  Starting Frontend (React + Vite)..."
cd frontend
if [ ! -d "node_modules" ]; then
  echo "   Installing npm packages..."
  npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Frontend running at http://localhost:5173"
echo ""
echo "🌐 Open your browser: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait and cleanup
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servers stopped.'" EXIT
wait
