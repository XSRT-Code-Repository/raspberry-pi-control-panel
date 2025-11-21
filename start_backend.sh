#!/bin/bash

# Backend Server Startup Script
# This script starts the Flask backend API server

echo "🚀 Starting Backend API Server..."
echo "================================="

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    echo "📦 Activating virtual environment..."
    source .venv/bin/activate
fi

# Check if Flask-CORS is installed
if ! python -c "import flask_cors" 2>/dev/null; then
    echo "⚠️  Flask-CORS not found. Installing dependencies..."
    pip install flask-cors
fi

# Start the backend server
echo "🎛️  Starting API server on http://localhost:5000"
echo "📡 Press Ctrl+C to stop"
echo ""

python run_backend.py
