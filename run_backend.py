#!/usr/bin/env python3
"""
Backend API server for Multi-Servo Controller
Runs separately from the React frontend
"""

import os
import sys
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
import backend.config as config
from backend.servo_controller import MultiServoController

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize servo controller
servo_controller = MultiServoController()

# Import and register API blueprints
from frontend.routes.api import api_bp

# Register API blueprint
app.register_blueprint(api_bp)

# Initialize controllers in API modules
from frontend.routes.api import servos, health
servos.init_servo_controller(servo_controller)
health.init_servo_controller(servo_controller)

def print_banner():
    """Print startup banner"""
    print("="*60)
    print("🎛️  MULTI-SERVO CONTROLLER API SERVER")
    print("="*60)
    print(f"📡 Host: {config.HOST}")
    print(f"🔌 Port: {config.PORT}")
    print(f"⚙️  Debug Mode: {'ON' if config.DEBUG else 'OFF'}")
    print(f"🌐 CORS: Enabled for all origins")
    print("="*60)

def print_servo_status():
    """Print current servo configuration status"""
    print("\n📋 CONFIGURED SERVOS:")
    print("-" * 40)
    
    servos_list = servo_controller.get_servo_list()
    if not servos_list:
        print("❌ No servos configured")
        return
    
    for servo in servos_list:
        status = "✅ ENABLED" if servo['enabled'] else "⚠️  DISABLED"
        print(f"• {servo['name']:<15} | Ch{servo['channel']:<2} | {status}")
        print(f"  Range: {servo['min_angle']}-{servo['max_angle']}° | Pos: {servo['current_position']}°")
    
    print("-" * 40)

def print_access_info():
    """Print access information"""
    print("\n🌐 API ACCESS INFORMATION:")
    print("-" * 40)
    print(f"🏠 Local:    http://localhost:{config.PORT}")
    
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        print(f"🌍 Network:  http://{ip}:{config.PORT}")
    except:
        print(f"🌍 Network:  http://your-pi-ip:{config.PORT}")
    
    print("-" * 40)
    print("\n📱 API ENDPOINTS:")
    print("• GET    /api/servos              - List all servos")
    print("• POST   /api/servos              - Add new servo")
    print("• GET    /api/servos/<id>/position - Get servo position")
    print("• POST   /api/servos/<id>/angle   - Set servo angle")
    print("• PUT    /api/servos/<id>         - Update servo config")
    print("• DELETE /api/servos/<id>         - Remove servo")
    print("• POST   /api/servos/<id>/sweep   - Sweep servo")
    print("• POST   /api/servos/center_all   - Center all servos")
    print("• GET    /api/health              - Health check")
    print("-" * 40)

def cleanup():
    """Clean up resources"""
    servo_controller.cleanup()
    print("\n🛑 Server shutdown complete")

def main():
    """Main entry point"""
    print_banner()
    
    try:
        print("\n🔧 INITIALIZING SYSTEM...")
        servo_controller.initialize()
        print("✅ System initialization complete")
        
        print_servo_status()
        print_access_info()
        
        print("\n🚀 Starting API server...")
        print("💡 Frontend should connect to this API server\n")
        
        socketio.run(app, host=config.HOST, port=config.PORT, debug=config.DEBUG, allow_unsafe_werkzeug=True)
    
    except KeyboardInterrupt:
        print("\n\n⚠️  Shutting down...")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cleanup()

if __name__ == '__main__':
    main()
