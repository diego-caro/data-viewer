#!/bin/bash

echo "Installing dependencies..."
cd backend && npm install --silent && cd ..
cd frontend && npm install --silent && cd ..

echo "Starting backend and frontend..."
cd backend && npm run dev &
BACKEND_PID=$!

cd frontend && npm start &
FRONTEND_PID=$!

echo ""
echo "✓ Backend running at http://localhost:3000"
echo "✓ Frontend running at http://localhost:4200"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID; exit 0" SIGINT
wait
