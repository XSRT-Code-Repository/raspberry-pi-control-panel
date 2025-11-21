#!/bin/bash

# Frontend Server Startup Script
# This script starts the React development server

echo "🚀 Starting Frontend Development Server..."
echo "=========================================="

cd frontend-react

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Get local IP address
LOCAL_IP=$(hostname -I | awk '{print $1}')

# Start the development server
echo "⚛️  Starting React dev server..."
echo "🏠 Local:   http://localhost:3000"
echo "🌍 Network: http://$LOCAL_IP:3000"
echo "📡 Press Ctrl+C to stop"
echo ""

npm run dev
