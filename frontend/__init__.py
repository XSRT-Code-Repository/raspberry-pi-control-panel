from flask import Flask
from flask_socketio import SocketIO
import backend.config as config
from backend.servo_controller import MultiServoController

# Initialize Flask app
app = Flask(__name__, static_folder="static", template_folder="templates")

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize servo controller
servo_controller = MultiServoController()

# Import and register route blueprints
from .routes import routes_bp
from .routes.api import api_bp

# Register blueprints
app.register_blueprint(routes_bp)
app.register_blueprint(api_bp)

# Initialize controllers in route modules
from .routes.api import servos, health
from .routes import webcam

servos.init_servo_controller(servo_controller)
health.init_servo_controller(servo_controller)
webcam.init_socketio_and_controller(socketio, servo_controller)

def cleanup():
    """Clean up resources"""
    servo_controller.cleanup()
    print("Server shutdown complete")

if __name__ == '__main__':
    try:
        print("Initializing multi-servo controller...")
        servo_controller.initialize()
        print(f"Starting web server on {config.HOST}:{config.PORT}")
        print(f"Open your browser and go to: http://{config.HOST}:{config.PORT}")
        socketio.run(app, host=config.HOST, port=config.PORT, debug=config.DEBUG)
    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        print(f"Error starting server: {e}")
    finally:
        cleanup()