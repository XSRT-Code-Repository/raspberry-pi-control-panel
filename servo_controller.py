import time
import json
from board import SCL, SDA
import busio
from adafruit_pca9685 import PCA9685
import config
import os

class MultiServoController:
    """Handles multiple servo motors via PCA9685 PWM driver"""
    
    def __init__(self):
        self.i2c = None
        self.pca = None
        self.servos = {}
        self.servo_configs = self.load_servo_configs()
        self.initialized = False
    
    def initialize(self):
        """Initialize I2C bus and PCA9685"""
        try:
            # Create I2C bus
            self.i2c = busio.I2C(SCL, SDA)
            
            # Create PCA9685 instance
            self.pca = PCA9685(self.i2c)
            self.pca.frequency = config.PWM_FREQUENCY
            
            # Initialize enabled servos
            self._initialize_servos()
            
            self.initialized = True
            print(f"Multi-servo controller initialized with {len(self.servos)} servos")
            
        except Exception as e:
            print(f"Failed to initialize servo controller: {e}")
            self.initialized = False
            raise
    
    def _initialize_servos(self):
        """Initialize individual servos based on configuration"""
        for servo_id, servo_config in self.servo_configs.items():
            if servo_config.get('enabled', False):
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
        """Get list of all configured servos"""
        return [
            {
                'id': servo_id,
                'name': config['name'],
                'channel': config['channel'],
                'enabled': config.get('enabled', False),
                'current_position': self.servos.get(servo_id, {}).get('current_position', config['default_angle']),
                'min_angle': config['min_angle'],
                'max_angle': config['max_angle']
            }
            for servo_id, config in self.servo_configs.items()
        ]
    
    def _set_servo_pulse(self, channel, pulse_us):
        """Set servo pulse width in microseconds"""
        if not self.initialized:
            raise RuntimeError("Servo controller not initialized")
        
        # PCA9685 has 12-bit resolution (0–4095)
        # Convert microseconds to duty cycle value
        duty_cycle = int(pulse_us / 20000 * 0xFFFF)
        channel.duty_cycle = duty_cycle
    
    def _set_servo_angle(self, servo_id, angle):
        """Internal method to set servo angle"""
        if servo_id not in self.servos:
            raise ValueError(f"Servo {servo_id} not found or not enabled")
        
        servo = self.servos[servo_id]
        servo_config = servo['config']
        
        # Validate angle range
        min_angle = servo_config['min_angle']
        max_angle = servo_config['max_angle']
        angle = max(min_angle, min(max_angle, int(angle)))
        
        # Convert angle to pulse width
        angle_range = max_angle - min_angle
        pulse_range = servo_config['max_pulse_us'] - servo_config['min_pulse_us']
        normalized_angle = (angle - min_angle) / angle_range
        pulse_us = servo_config['min_pulse_us'] + normalized_angle * pulse_range
        
        # Set the servo pulse
        self._set_servo_pulse(servo['channel'], pulse_us)
        
        # Update current position
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
            # Validate configuration
            required_fields = ['name', 'channel', 'min_angle', 'max_angle', 'min_pulse_us', 'max_pulse_us', 'default_angle']
            for field in required_fields:
                if field not in servo_config:
                    raise ValueError(f"Missing required field: {field}")
            
            # Check channel availability
            channel = servo_config['channel']
            if channel < 0 or channel >= 16:
                raise ValueError("Channel must be between 0 and 15")
            
            # Check if channel is already in use
            for existing_id, existing_config in self.servo_configs.items():
                if existing_config['channel'] == channel and existing_config.get('enabled', False):
                    if existing_id != servo_id:
                        raise ValueError(f"Channel {channel} already in use by {existing_config['name']}")
            
            # Add to configuration
            self.servo_configs[servo_id] = servo_config
            
            # Initialize if enabled
            if servo_config.get('enabled', False) and self.initialized:
                channel_obj = self.pca.channels[channel]
                self.servos[servo_id] = {
                    'channel': channel_obj,
                    'config': servo_config,
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
                self._set_servo_angle(servo_id, config.SAFE_SHUTDOWN_ANGLE)
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
            
            # Update configuration
            self.servo_configs[servo_id].update(new_config)
            
            # Re-initialize if enabled
            if new_config.get('enabled', False):
                if servo_id in self.servos:
                    del self.servos[servo_id]
                
                channel_obj = self.pca.channels[new_config['channel']]
                self.servos[servo_id] = {
                    'channel': channel_obj,
                    'config': self.servo_configs[servo_id],
                    'current_position': new_config.get('default_angle', 90)
                }
                self._set_servo_angle(servo_id, new_config.get('default_angle', 90))
            else:
                # Disable servo
                if servo_id in self.servos:
                    del self.servos[servo_id]
            
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
    
    def center_all(self):
        """Move all servos to their center positions"""
        results = {}
        for servo_id in self.servos:
            servo_config = self.servo_configs[servo_id]
            center_angle = (servo_config['min_angle'] + servo_config['max_angle']) // 2
            success, angle = self.set_angle(servo_id, center_angle)
            results[servo_id] = {'success': success, 'angle': angle}
        return results
    
    def sweep_servo(self, servo_id, start_angle=None, end_angle=None, step=10, delay=0.1):
        """
        Perform a sweep motion for a specific servo
        """
        try:
            if servo_id not in self.servos:
                return False, "Servo not found or not enabled"
            
            servo_config = self.servo_configs[servo_id]
            
            if start_angle is None:
                start_angle = servo_config['min_angle']
            if end_angle is None:
                end_angle = servo_config['max_angle']
            
            if start_angle <= end_angle:
                angles = range(start_angle, end_angle + 1, step)
            else:
                angles = range(start_angle, end_angle - 1, -step)
            
            for angle in angles:
                self.set_angle(servo_id, angle)
                time.sleep(delay)
            
            return True, "Sweep completed"
                
        except Exception as e:
            return False, str(e)
    
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