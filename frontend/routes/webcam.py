from flask import render_template
import cv2
import threading
import base64
import time

from . import routes_bp

# This will be set by the main app
socketio = None
servo_controller = None

def init_socketio_and_controller(sio, controller):
    global socketio, servo_controller
    socketio = sio
    servo_controller = controller

    # Register WebSocket event handlers after socketio is initialized
    register_socket_events()

def register_socket_events():
    @socketio.on('connect', namespace='/webcam')
    def handle_connect():
        print('WebSocket client connected to webcam namespace')
        socketio.emit('status', {'message': 'Connected to webcam stream'}, namespace='/webcam')

    @socketio.on('disconnect', namespace='/webcam')
    def handle_disconnect():
        print('WebSocket client disconnected from webcam namespace')
        streamer.stop_streaming()

    @socketio.on('start_stream', namespace='/webcam')
    def handle_start_stream():
        if not streamer.streaming_active:
            streamer.start_streaming()

    @socketio.on('stop_stream', namespace='/webcam')
    def handle_stop_stream():
        streamer.stop_streaming()

    @socketio.on('update_settings', namespace='/webcam')
    def handle_update_settings(data):
        if streamer.update_settings(data):
            socketio.emit('settings_updated', {'success': True}, namespace='/webcam')
        else:
            socketio.emit('error', {'message': 'Failed to update settings'}, namespace='/webcam')

class WebcamStreamer:
    def __init__(self):
        self.camera = None
        self.camera_lock = threading.Lock()
        self.streaming_active = False
        self.stream_thread = None
        self.settings = {
            'resolution': (640, 480),
            'latency': 0.033,  # ~30 FPS
            'quality': 80
        }

    def update_settings(self, new_settings):
        """Update streaming settings"""
        try:
            # Parse resolution
            width, height = map(int, new_settings.get('resolution', '640x480').split('x'))
            self.settings['resolution'] = (width, height)

            # Update other settings
            self.settings['latency'] = float(new_settings.get('latency', 0.033))
            self.settings['quality'] = int(new_settings.get('quality', 80))

            print(f"Updated webcam settings: {self.settings}")
            return True
        except Exception as e:
            print(f"Error updating settings: {e}")
            return False

    def get_camera(self):
        with self.camera_lock:
            if self.camera is None or not self.camera.isOpened():
                self.camera = cv2.VideoCapture(0)
                if not self.camera.isOpened():
                    raise RuntimeError("Could not start camera.")
            return self.camera

    def start_streaming(self):
        if self.streaming_active:
            return

        self.streaming_active = True
        self.stream_thread = threading.Thread(target=self.stream_video)
        self.stream_thread.daemon = True
        self.stream_thread.start()
        socketio.emit('status', {'message': 'Stream started'}, namespace='/webcam')

    def stop_streaming(self):
        self.streaming_active = False
        if self.stream_thread and self.stream_thread.is_alive():
            self.stream_thread.join(timeout=1.0)
        socketio.emit('status', {'message': 'Stream stopped'}, namespace='/webcam')

    def stream_video(self):
        try:
            camera = self.get_camera()
            while self.streaming_active:
                success, frame = camera.read()
                if not success:
                    socketio.emit('error', {'message': 'Failed to read frame from camera'}, namespace='/webcam')
                    break

                # Resize frame based on current settings
                width, height = self.settings['resolution']
                frame = cv2.resize(frame, (width, height))

                # Encode frame as JPEG with current quality setting
                ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, self.settings['quality']])
                if not ret:
                    continue

                # Convert to base64 for WebSocket transmission
                frame_data = base64.b64encode(buffer).decode('utf-8')

                # Emit frame to client
                socketio.emit('video_frame', {'frame': frame_data}, namespace='/webcam')

                # Small delay to control frame rate based on latency setting
                time.sleep(self.settings['latency'])

        except Exception as e:
            print(f"Error in video streaming: {e}")
            socketio.emit('error', {'message': str(e)}, namespace='/webcam')
        finally:
            self.streaming_active = False

# Create global streamer instance
streamer = WebcamStreamer()

@routes_bp.route('/webcam')
def webcam():
    """Serve the webcam streaming page"""
    return render_template('webcam.html')