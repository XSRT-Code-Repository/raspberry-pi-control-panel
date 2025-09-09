#!/usr/bin/env python3
"""
Development server runner for Multi-Servo Controller
Run this file to start the development server with enhanced logging and auto-reload
"""

import os
import sys
from frontend import app, servo_controller, cleanup
import backend.config as config

def print_banner():
    """Print startup banner"""
    print("="*60)
    print("🎛️  MULTI-SERVO CONTROLLER DEVELOPMENT SERVER")
    print("="*60)
    print(f"📡 Host: {config.HOST}")
    print(f"🔌 Port: {config.PORT}")
    print(f"⚙️  Debug Mode: {'ON' if config.DEBUG else 'OFF'}")
    print(f"🎯 PWM Frequency: {config.PWM_FREQUENCY}Hz")
    print(f"📊 Max Servos: {config.MAX_SERVOS}")
    print("="*60)

def print_servo_status():
    """Print current servo configuration status"""
    print("\n📋 CONFIGURED SERVOS:")
    print("-" * 40)
    
    servos = servo_controller.get_servo_list()
    if not servos:
        print("❌ No servos configured")
        return
    
    for servo in servos:
        status = "✅ ENABLED" if servo['enabled'] else "⚠️  DISABLED"
        print(f"• {servo['name']:<15} | Ch{servo['channel']:<2} | {status}")
        print(f"  Range: {servo['min_angle']}-{servo['max_angle']}° | Pos: {servo['current_position']}°")
    
    print("-" * 40)

def print_access_info():
    """Print access information"""
    print("\n🌐 ACCESS INFORMATION:")
    print("-" * 40)
    print(f"🏠 Local:    http://localhost:{config.PORT}")
    print(f"🌍 Network:  http://{get_local_ip()}:{config.PORT}")
    print("-" * 40)
    print("\n📱 FEATURES:")
    print("• Individual servo control with sliders")
    print("• Real-time position feedback")
    print("• Web-based servo configuration")
    print("• Add/edit/remove servos dynamically")
    print("• Sweep demonstrations")
    print("• Keyboard shortcuts (C=center, R=refresh, ESC=close)")
    print("-" * 40)

def get_local_ip():
    """Get local IP address"""
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "your-pi-ip"

def check_dependencies():
    """Check if all required dependencies are available"""
    try:
        import board
        import busio
        import adafruit_pca9685
        print("✅ Hardware libraries available")
        return True
    except ImportError as e:
        print("⚠️  Hardware libraries not found - running in MOCK MODE")
        print("💡 For hardware support install: pip install -r requirements.txt")
        return "mock"
    except Exception as e:
        print(f"❌ Error checking dependencies: {e}")
        return False

def main():
    """Main entry point"""
    print_banner()
    
    # Check dependencies
    dep_status = check_dependencies()
    if dep_status is False:  # Only exit if there's a real error
        sys.exit(1)
    
    try:
        print("\n🔧 INITIALIZING SYSTEM...")
        if dep_status == "mock":
            print("⚠️  Running in MOCK MODE - No hardware control available")
            print("💡 All servo operations will be simulated")
        
        servo_controller.initialize()
        print("✅ System initialization complete")
        
        print_servo_status()
        print_access_info()
        
        if dep_status == "mock":
            print("\n⚠️  MOCK MODE ACTIVE - Hardware control disabled")
        
        print("\n🚀 STARTING WEB SERVER...")
        print("Press Ctrl+C to stop the server\n")
        
        # Start the Flask development server
        app.run(
            host=config.HOST,
            port=config.PORT,
            debug=config.DEBUG,
            use_reloader=False,  # Disable reloader to avoid hardware conflicts
            threaded=True
        )
        
    except KeyboardInterrupt:
        print("\n\n🛑 SHUTDOWN REQUESTED")
        print("Cleaning up system...")
        
    except Exception as e:
        print(f"\n❌ ERROR STARTING SERVER: {e}")
        if dep_status != "mock":
            print("Check your hardware connections and try again")
        
    finally:
        cleanup()
        print("👋 Server stopped. Goodbye!")

if __name__ == '__main__':
    main()