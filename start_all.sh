#!/bin/bash

# Full Stack Startup Script
# This script starts both the backend API server and the React frontend

echo "🚀 Starting Full Stack Application..."
echo "====================================="

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend in background
echo "📡 Starting Backend API Server..."
./start_backend.sh &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend in background
echo "⚛️  Starting Frontend Development Server..."
./start_frontend.sh &
FRONTEND_PID=$!

echo ""
echo "✅ Services started successfully!"
echo "================================="
echo "📡 Backend API:  http://localhost:5000"
echo "⚛️  Frontend UI:  http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for background processes
wait
