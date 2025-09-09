from flask import Flask
import backend.config as config
from backend.servo_controller import MultiServoController
from frontend.route import Route

# Initialize Flask app
app = Flask(__name__, static_folder="static", template_folder="templates")

# Initialize servo controller
servo_controller = MultiServoController()

# Pass app to Route class to register all routes
Route(app)

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
        app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        print(f"Error starting server: {e}")
    finally:
        cleanup()