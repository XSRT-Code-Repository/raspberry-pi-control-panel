from flask import jsonify
from . import api_bp

# This will be set by the main app
servo_controller = None

def init_servo_controller(controller):
    global servo_controller
    servo_controller = controller

@api_bp.route('/health', methods=['GET'])
def health_check():
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