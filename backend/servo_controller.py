# Try importing hardware-specific libraries
try:
    from board import SCL, SDA
    import busio
    from adafruit_pca9685 import PCA9685
    HARDWARE_AVAILABLE = True
except:
    print("Hardware libraries not found - running in mock mode")
    HARDWARE_AVAILABLE = False

import time
import json
import backend.config as config
import os

class MockPCA9685Channel:
    """Mock implementation of PCA9685 channel"""
    def __init__(self):
        self.duty_cycle = 0

class MockPCA9685:
    """Mock implementation of PCA9685"""
    def __init__(self):
        self.frequency = 50
        self.channels = [MockPCA9685Channel() for _ in range(16)]
    
    def deinit(self):
        pass

class MultiServoController:
    """Handles multiple servo motors via PCA9685 PWM driver"""
    
    def __init__(self):
        self.i2c = None
        self.pca = None
        self.servos = {}
        self.servo_configs = self.load_servo_configs()
        self.initialized = False
        self.mock_mode = not HARDWARE_AVAILABLE
    
    def initialize(self):
        """Initialize I2C bus and PCA9685"""
        try:
            if self.mock_mode:
                # Create mock PCA9685 instance
                self.pca = MockPCA9685()
                self.initialized = True
                print("Multi-servo controller initialized in MOCK MODE")
            else:
                # Create I2C bus
                self.i2c = busio.I2C(SCL, SDA)
                
                # Create PCA9685 instance
                self.pca = PCA9685(self.i2c)
                self.pca.frequency = config.PWM_FREQUENCY
                
                self.initialized = True
                print(f"Multi-servo controller initialized with hardware")
            
            # Initialize enabled servos
            self._initialize_servos()
            print(f"Initialized {len(self.servos)} servos")
            
        except Exception as e:
            print(f"Failed to initialize servo controller: {e}")
            self.initialized = False
            raise
    
    def _initialize_servos(self):
        """Initialize individual servos based on configuration"""
        for servo_id, servo_config in self.servo_configs.items():
            try:
                channel = self.pca.channels[servo_config['channel']]
                self.servos[servo_id] = {
                    'channel': channel,
                    'config': servo_config,
                    'current_position': servo_config['default_angle']
                }
                # Set to default position
                self._set_servo_angle(servo_id, servo_config['default_angle'])
                print(f"Initialized {servo_config['name']} on channel {servo_config['channel']}")
            except Exception as e:
                print(f"Failed to initialize servo {servo_id}: {e}")
    
    def is_connected(self):
        """Check if servo controller is properly connected"""
        return self.initialized and self.pca is not None
    
    def get_servo_list(self):
        """Get list of all configured servos, including open/close angles if present"""
        return [
            {
                'id': servo_id,
                'name': config['name'],
                'channel': config['channel'],
                'current_position': self.servos.get(servo_id, {}).get('current_position', config['default_angle']),
                'open_angle': config.get('open_angle'),
                'close_angle': config.get('close_angle')
            }
            for servo_id, config in self.servo_configs.items()
        ]
    def open_servo(self, servo_id):
        """Move servo to its open position (open_angle)"""
        config = self.servo_configs.get(servo_id)
        if not config:
            return False, "Servo not found"
        angle = config.get('open_angle')
        return self.set_angle(servo_id, angle)

    def close_servo(self, servo_id):
        """Move servo to its close position (close_angle)"""
        config = self.servo_configs.get(servo_id)
        if not config:
            return False, "Servo not found"
        angle = config.get('close_angle')
        return self.set_angle(servo_id, angle)
    
    def _set_servo_pulse(self, channel, pulse_us):
        """Set servo pulse width in microseconds"""
        if not self.initialized:
            raise RuntimeError("Servo controller not initialized")
        
        # PCA9685 has 12-bit resolution (0–4095)
        # Convert microseconds to duty cycle value
        duty_cycle = int(pulse_us / 20000 * 0xFFFF)
        channel.duty_cycle = duty_cycle
        
        if self.mock_mode:
            # Print mock output for debugging
            print(f"MOCK: Setting pulse width to {pulse_us}μs (duty cycle: {duty_cycle})")

    def _set_servo_angle(self, servo_id, angle):
        """Internal method to set servo angle"""
        if servo_id not in self.servos:
            raise ValueError(f"Servo {servo_id} not found or not enabled")
        servo = self.servos[servo_id]
        servo_config = servo['config']
        angle = int(angle)
        # Use open_angle and close_angle for bounds
        min_angle = servo_config.get('close_angle', 0)
        max_angle = servo_config.get('open_angle', 180)
        angle = max(min_angle, min(max_angle, angle))
        # Convert angle to pulse width (simple mapping: 0deg=500us, 180deg=2500us)
        pulse_us = 500 + (angle / 180) * (2500 - 500)
        self._set_servo_pulse(servo['channel'], pulse_us)
        servo['current_position'] = angle
        return angle
    
    def set_angle(self, servo_id, angle):
        """
        Set servo angle
        Returns: (success: bool, actual_angle: int)
        """
        try:
            actual_angle = self._set_servo_angle(servo_id, angle)
            print(f"{self.servo_configs[servo_id]['name']} moved to {actual_angle}°")
            return True, actual_angle
        except Exception as e:
            print(f"Error setting servo {servo_id} angle: {e}")
            return False, self.get_position(servo_id)
    
    def get_position(self, servo_id):
        """Get current servo position in degrees"""
        if servo_id in self.servos:
            return self.servos[servo_id]['current_position']
        return self.servo_configs.get(servo_id, {}).get('default_angle', 0)
    
    def get_all_positions(self):
        """Get positions of all servos"""
        return {
            servo_id: servo['current_position'] 
            for servo_id, servo in self.servos.items()
        }
    
    def add_servo(self, servo_id, servo_config):
        """Add a new servo configuration"""
        try:
            print(servo_config)
            required_fields = ['name', 'channel', 'open_angle', 'close_angle', 'default_angle']
            for field in required_fields:
                if field not in servo_config:
                    raise ValueError(f"Missing required field: {field}")
            channel = servo_config['channel']
            if channel < 0 or channel >= 16:
                raise ValueError("Channel must be between 0 and 15")
            for existing_id, existing_config in self.servo_configs.items():
                if existing_config['channel'] == channel:
                    if existing_id != servo_id:
                        raise ValueError(f"Channel {channel} already in use by {existing_config['name']}")
            self.servo_configs[servo_id] = {k: servo_config[k] for k in required_fields}
            if self.initialized:
                channel_obj = self.pca.channels[channel]
                self.servos[servo_id] = {
                    'channel': channel_obj,
                    'config': self.servo_configs[servo_id],
                    'current_position': servo_config['default_angle']
                }
                self._set_servo_angle(servo_id, servo_config['default_angle'])
            self.save_servo_configs()
            return True, "Servo added successfully"
        except Exception as e:
            return False, str(e)
    
    def remove_servo(self, servo_id):
        """Remove a servo configuration"""
        try:
            if servo_id in self.servos:
                # Move to safe position before removing
                self._set_servo_angle(servo_id, self.servo_configs[servo_id].get('default_angle', config.SAFE_SHUTDOWN_ANGLE))
                del self.servos[servo_id]
            
            if servo_id in self.servo_configs:
                del self.servo_configs[servo_id]
            
            self.save_servo_configs()
            return True, "Servo removed successfully"
            
        except Exception as e:
            return False, str(e)
    
    def update_servo_config(self, servo_id, new_config):
        """Update servo configuration"""
        try:
            if servo_id not in self.servo_configs:
                return False, "Servo not found"
            allowed_fields = ['name', 'channel', 'open_angle', 'close_angle', 'default_angle']
            filtered_config = {k: v for k, v in new_config.items() if k in allowed_fields}
            self.servo_configs[servo_id].update(filtered_config)
            # Always re-initialize after update
            if servo_id in self.servos:
                del self.servos[servo_id]
            channel_obj = self.pca.channels[self.servo_configs[servo_id]['channel']]
            self.servos[servo_id] = {
                'channel': channel_obj,
                'config': self.servo_configs[servo_id],
                'current_position': self.servo_configs[servo_id].get('default_angle', 90)
            }
            self._set_servo_angle(servo_id, self.servo_configs[servo_id].get('default_angle', 90))
            self.save_servo_configs()
            return True, "Servo configuration updated"
        except Exception as e:
            return False, str(e)

    def load_servo_configs(self):
        """Load servo configurations from JSON file"""
        if os.path.exists(config.SERVO_CONFIG_FILE):
            with open(config.SERVO_CONFIG_FILE, 'r') as f:
                return json.load(f)
        return {}

    def save_servo_configs(self):
        """Save servo configurations to JSON file"""
        with open(config.SERVO_CONFIG_FILE, 'w') as f:
            json.dump(self.servo_configs, f, indent=4)
    
    def cleanup(self):
        """Clean up resources and deinitialize hardware"""
        if self.pca:
            try:
                # Move all servos to safe positions
                for servo_id in self.servos:
                    servo_config = self.servo_configs[servo_id]
                    safe_angle = servo_config.get('default_angle', config.SAFE_SHUTDOWN_ANGLE)
                    self._set_servo_angle(servo_id, safe_angle)
                
                time.sleep(0.5)  # Allow time for movement
                
                # Deinitialize PCA9685
                self.pca.deinit()
                print("Multi-servo controller cleaned up")
                
            except Exception as e:
                print(f"Error during cleanup: {e}")
            finally:
                self.initialized = False
                self.pca = None
                self.servos = {}