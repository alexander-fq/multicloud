#!/bin/bash

echo "=========================================="
echo "  GovTech Cloud Migration Platform"
echo "=========================================="
echo ""

# Backend
echo "[1/2] Starting Backend (Port 3000)..."
cd app/backend
npm start > ../../backend.log 2>&1 &
BACKEND_PID=$!
echo "      Backend PID: $BACKEND_PID"
echo "      Logs: backend.log"

sleep 3

# Frontend
echo ""
echo "[2/2] Starting Frontend (Port 5173)..."
cd ../frontend
npm run dev > ../../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "      Frontend PID: $FRONTEND_PID"
echo "      Logs: frontend.log"

sleep 3

echo ""
echo "=========================================="
echo "Services Started Successfully!"
echo "=========================================="
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3000"
echo ""
echo "To view logs:"
echo "  Backend:  tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo ""
echo "To stop services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop monitoring..."
echo ""

# Monitor both logs
tail -f backend.log frontend.log 2>/dev/null
