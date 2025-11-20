from flask import jsonify
from . import api_bp
import backend.config as config

@api_bp.route('/config', methods=['GET'])
def get_config():
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