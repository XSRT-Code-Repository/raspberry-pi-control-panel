from flask import jsonify, request, render_template, Response
import cv2
import threading
import base64
import time

import backend.config as config

class Route:
    def __init__(self, app, servo_controller, socketio):
        self.app = app
        self.servo_controller = servo_controller
        self.socketio = socketio
        self.camera = None
        self.camera_lock = threading.Lock()
        self.streaming_active = False
        self.stream_thread = None
        self.register_routes()
        self.register_socket_events()

    def get_camera(self):
        with self.camera_lock:
            if self.camera is None or not self.camera.isOpened():
                self.camera = cv2.VideoCapture(0)
                if not self.camera.isOpened():
                    raise RuntimeError("Could not start camera.")
            return self.camera

    def register_socket_events(self):
        @self.socketio.on('connect', namespace='/webcam')
        def handle_connect():
            print('WebSocket client connected to webcam namespace')
            self.socketio.emit('status', {'message': 'Connected to webcam stream'}, namespace='/webcam')

        @self.socketio.on('disconnect', namespace='/webcam')
        def handle_disconnect():
            print('WebSocket client disconnected from webcam namespace')
            self.stop_streaming()

        @self.socketio.on('start_stream', namespace='/webcam')
        def handle_start_stream():
            if not self.streaming_active:
                self.start_streaming()

        @self.socketio.on('stop_stream', namespace='/webcam')
        def handle_stop_stream():
            self.stop_streaming()

    def start_streaming(self):
        if self.streaming_active:
            return

        self.streaming_active = True
        self.stream_thread = threading.Thread(target=self.stream_video)
        self.stream_thread.daemon = True
        self.stream_thread.start()
        self.socketio.emit('status', {'message': 'Stream started'}, namespace='/webcam')

    def stop_streaming(self):
        self.streaming_active = False
        if self.stream_thread and self.stream_thread.is_alive():
            self.stream_thread.join(timeout=1.0)
        self.socketio.emit('status', {'message': 'Stream stopped'}, namespace='/webcam')

    def stream_video(self):
        try:
            camera = self.get_camera()
            while self.streaming_active:
                success, frame = camera.read()
                if not success:
                    self.socketio.emit('error', {'message': 'Failed to read frame from camera'}, namespace='/webcam')
                    break

                # Resize frame for better performance
                frame = cv2.resize(frame, (640, 480))

                # Encode frame as JPEG
                ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                if not ret:
                    continue

                # Convert to base64 for WebSocket transmission
                frame_data = base64.b64encode(buffer).decode('utf-8')

                # Emit frame to client
                self.socketio.emit('video_frame', {'frame': frame_data}, namespace='/webcam')

                # Small delay to control frame rate (~30 FPS)
                time.sleep(0.033)

        except Exception as e:
            print(f"Error in video streaming: {e}")
            self.socketio.emit('error', {'message': str(e)}, namespace='/webcam')
        finally:
            self.streaming_active = False

    def register_routes(self):
        app = self.app

        @app.route('/')
        def index():
            """Serve the main control interface"""
            return render_template('index.html')

        @app.route('/api/servos', methods=['GET'])
        def get_servos():
            try:
                servos = self.servo_controller.get_servo_list()
                return jsonify({'success': True, 'servos': servos})
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)})

        @app.route('/api/servos/<servo_id>/angle', methods=['POST'])
        def set_servo_angle(servo_id):
            try:
                data = request.get_json()
                angle = data.get('angle')
                if angle is None:
                    return jsonify({'success': False, 'error': 'No angle provided'})
                success, result_angle = self.servo_controller.set_angle(servo_id, angle)
                if success:
                    return jsonify({'success': True, 'servo_id': servo_id, 'angle': result_angle})
                else:
                    return jsonify({'success': False, 'error': 'Failed to set angle'})
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)})

        @app.route('/api/servos/<servo_id>/position', methods=['GET'])
        def get_servo_position(servo_id):
            try:
                position = self.servo_controller.get_position(servo_id)
                return jsonify({'success': True, 'servo_id': servo_id, 'angle': position})
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)})

        @app.route('/api/servos/positions', methods=['GET'])
        def get_all_positions():
            try:
                positions = self.servo_controller.get_all_positions()
                return jsonify({'success': True, 'positions': positions})
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)})

        @app.route('/api/servos', methods=['POST'])
        def add_servo():
            try:
                data = request.get_json()
                servo_id = data.get('servo_id')
                servo_config = data.get('config')
                if not servo_id or not servo_config:
                    return jsonify({'success': False, 'error': 'Missing servo_id or config'})
                success, message = self.servo_controller.add_servo(servo_id, servo_config)
                return jsonify({'success': success, 'message': message})
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)})

        @app.route('/api/servos/<servo_id>', methods=['PUT'])
        def update_servo(servo_id):
            try:
                data = request.get_json()
                success, message = self.servo_controller.update_servo_config(servo_id, data)
                return jsonify({'success': success, 'message': message})
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)})

        @app.route('/api/servos/<servo_id>', methods=['DELETE'])
        def remove_servo(servo_id):
            try:
                success, message = self.servo_controller.remove_servo(servo_id)
                return jsonify({'success': success, 'message': message})
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)})

        @app.route('/api/servos/<servo_id>/sweep', methods=['POST'])
        def sweep_servo(servo_id):
            try:
                data = request.get_json() or {}
                start_angle = data.get('start_angle')
                end_angle = data.get('end_angle')
                step = data.get('step', 10)
                delay = data.get('delay', 0.1)
                success, message = self.servo_controller.sweep_servo(servo_id, start_angle, end_angle, step, delay)
                return jsonify({'success': success, 'message': message})
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)})

        @app.route('/api/servos/center_all', methods=['POST'])
        def center_all_servos():
            try:
                results = self.servo_controller.center_all()
                return jsonify({'success': True, 'results': results})
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)})

        @app.route('/api/config', methods=['GET'])
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

        @app.route('/api/health', methods=['GET'])
        def health_check():
            try:
                return jsonify({
                    'success': True,
                    'status': 'healthy',
                    'servo_connected': self.servo_controller.is_connected(),
                    'active_servos': len(self.servo_controller.servos),
                    'total_configured': len(self.servo_controller.servo_configs)
                })
            except Exception as e:
                return jsonify({'success': False, 'error': str(e)})

        @app.route('/webcam')
        def webcam():
            """Serve the webcam streaming page"""
            return render_template('webcam.html')