from flask import Flask, render_template, request, jsonify
from servo_controller import MultiServoController
import config
import json
import os

# Initialize Flask app
app = Flask(__name__)

# Initialize servo controller
servo_controller = MultiServoController()

@app.route('/')
def index():
    """Serve the main control interface"""
    return render_template('index.html')

@app.route('/api/servos', methods=['GET'])
def get_servos():
    """Get list of all configured servos"""
    try:
        servos = servo_controller.get_servo_list()
        return jsonify({'success': True, 'servos': servos})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/servos/<servo_id>/angle', methods=['POST'])
def set_servo_angle(servo_id):
    """Set angle for a specific servo"""
    try:
        data = request.get_json()
        angle = data.get('angle')
        
        if angle is None:
            return jsonify({'success': False, 'error': 'No angle provided'})
        
        success, result_angle = servo_controller.set_angle(servo_id, angle)
        
        if success:
            return jsonify({'success': True, 'servo_id': servo_id, 'angle': result_angle})
        else:
            return jsonify({'success': False, 'error': 'Failed to set angle'})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/servos/<servo_id>/position', methods=['GET'])
def get_servo_position(servo_id):
    """Get current position of a specific servo"""
    try:
        position = servo_controller.get_position(servo_id)
        return jsonify({'success': True, 'servo_id': servo_id, 'angle': position})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/servos/positions', methods=['GET'])
def get_all_positions():
    """Get positions of all servos"""
    try:
        positions = servo_controller.get_all_positions()
        return jsonify({'success': True, 'positions': positions})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/servos', methods=['POST'])
def add_servo():
    """Add a new servo configuration"""
    try:
        data = request.get_json()
        servo_id = data.get('servo_id')
        servo_config = data.get('config')
        
        if not servo_id or not servo_config:
            return jsonify({'success': False, 'error': 'Missing servo_id or config'})
        
        success, message = servo_controller.add_servo(servo_id, servo_config)

        return jsonify({'success': success, 'message': message})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/servos/<servo_id>', methods=['PUT'])
def update_servo(servo_id):
    """Update servo configuration"""
    try:
        data = request.get_json()
        
        success, message = servo_controller.update_servo_config(servo_id, data)

        return jsonify({'success': success, 'message': message})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/servos/<servo_id>', methods=['DELETE'])
def remove_servo(servo_id):
    """Remove a servo configuration"""
    try:
        success, message = servo_controller.remove_servo(servo_id)

        return jsonify({'success': success, 'message': message})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/servos/<servo_id>/sweep', methods=['POST'])
def sweep_servo(servo_id):
    """Perform sweep motion for a specific servo"""
    try:
        data = request.get_json() or {}
        start_angle = data.get('start_angle')
        end_angle = data.get('end_angle')
        step = data.get('step', 10)
        delay = data.get('delay', 0.1)
        
        success, message = servo_controller.sweep_servo(servo_id, start_angle, end_angle, step, delay)
        
        return jsonify({'success': success, 'message': message})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/servos/center_all', methods=['POST'])
def center_all_servos():
    """Center all servos"""
    try:
        results = servo_controller.center_all()
        return jsonify({'success': True, 'results': results})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/config', methods=['GET'])
def get_config():
    """Get current configuration"""
    try:
        return jsonify({
            'success': True,
            'config': {
                'pwm_frequency': config.PWM_FREQUENCY,
                'max_servos': config.MAX_SERVOS,
                'default_servo_config': config.DEFAULT_SERVO_CONFIG
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        return jsonify({
            'success': True,
            'status': 'healthy',
            'servo_connected': servo_controller.is_connected(),
            'active_servos': len(servo_controller.servos),
            'total_configured': len(servo_controller.servo_configs)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

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
        
        # Start the web server
        app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
        
    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        print(f"Error starting server: {e}")
    finally:
        cleanup()