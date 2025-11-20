from flask import jsonify, request
from . import api_bp
import backend.config as config

# This will be set by the main app
servo_controller = None

def init_servo_controller(controller):
    global servo_controller
    servo_controller = controller

@api_bp.route('/servos', methods=['GET'])
def get_servos():
    try:
        servos = servo_controller.get_servo_list()
        return jsonify({'success': True, 'servos': servos})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@api_bp.route('/servos/<servo_id>/angle', methods=['POST'])
def set_servo_angle(servo_id):
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

@api_bp.route('/servos/<servo_id>/position', methods=['GET'])
def get_servo_position(servo_id):
    try:
        position = servo_controller.get_position(servo_id)
        return jsonify({'success': True, 'servo_id': servo_id, 'angle': position})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@api_bp.route('/servos/positions', methods=['GET'])
def get_all_positions():
    try:
        positions = servo_controller.get_all_positions()
        return jsonify({'success': True, 'positions': positions})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@api_bp.route('/servos', methods=['POST'])
def add_servo():
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

@api_bp.route('/servos/<servo_id>', methods=['PUT'])
def update_servo(servo_id):
    try:
        data = request.get_json()
        success, message = servo_controller.update_servo_config(servo_id, data)
        return jsonify({'success': success, 'message': message})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@api_bp.route('/servos/<servo_id>', methods=['DELETE'])
def remove_servo(servo_id):
    try:
        success, message = servo_controller.remove_servo(servo_id)
        return jsonify({'success': success, 'message': message})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@api_bp.route('/servos/<servo_id>/sweep', methods=['POST'])
def sweep_servo(servo_id):
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

@api_bp.route('/servos/center_all', methods=['POST'])
def center_all_servos():
    try:
        results = servo_controller.center_all()
        return jsonify({'success': True, 'results': results})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})