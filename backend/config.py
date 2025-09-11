# Configuration file for Multi-Servo Controller

# Hardware Configuration
PWM_FREQUENCY = 50       # PWM frequency in Hz (50Hz for servos)

# Default Servo Configuration
DEFAULT_SERVO_CONFIG = {
    "name": "Servo",
    "channel": 0,
    "open_angle": 180,
    "close_angle": 90,
    "default_angle": 90
}

SERVO_CONFIG_FILE = 'servo_configs.json'  # File to save/load servo configurations

# Web Server Configuration
HOST = '0.0.0.0'        # Server host (0.0.0.0 for all interfaces)
PORT = 5000             # Server port
DEBUG = True           # Flask debug mode

# Safety Configuration
SAFE_SHUTDOWN_ANGLE = 90  # Angle to move to on shutdown
MOVEMENT_DELAY = 0.02     # Minimum delay between movements (seconds)
MAX_SERVOS = 16          # Maximum number of servos (PCA9685 limit)