# Configuration file for Multi-Servo Controller

# Hardware Configuration
PWM_FREQUENCY = 50       # PWM frequency in Hz (50Hz for servos)

# Default Servo Configuration
DEFAULT_SERVO_CONFIG = {
    'name': 'Servo',
    'channel': 0,
    'min_angle': 0,
    'max_angle': 180,
    'min_pulse_us': 500,
    'max_pulse_us': 2500,
    'default_angle': 90,
    'enabled': True
}

SERVO_CONFIG_FILE = 'servo_configs.json'  # File to save/load servo configurations

# Pre-configured servos (can be modified via web interface)
SERVOS = {
    'servo_0': {
        'name': 'Base Servo',
        'channel': 0,
        'min_angle': 0,
        'max_angle': 180,
        'min_pulse_us': 500,
        'max_pulse_us': 2500,
        'default_angle': 90,
        'enabled': True
    }
}

# Web Server Configuration
HOST = '0.0.0.0'        # Server host (0.0.0.0 for all interfaces)
PORT = 5000             # Server port
DEBUG = True           # Flask debug mode

# Safety Configuration
SAFE_SHUTDOWN_ANGLE = 90  # Angle to move to on shutdown
MOVEMENT_DELAY = 0.02     # Minimum delay between movements (seconds)
MAX_SERVOS = 16          # Maximum number of servos (PCA9685 limit)