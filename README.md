# Servo Control Web Server Project

## Project Structure
```
servo_controller/
├── app.py              # Main Flask application
├── servo_controller.py # Servo hardware control class
├── config.py          # Configuration settings
├── static/
│   ├── style.css      # CSS styles
│   └── script.js      # JavaScript functionality
├── templates/
│   └── index.html     # HTML template
└── requirements.txt   # Python dependencies
```

## Installation & Setup

1. **Create project directory:**
```bash
mkdir servo_controller
cd servo_controller
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Run the application:**
```bash
python app.py
```

4. **Access the web interface:**
Open browser to `http://localhost:5000`

## Usage

- Use the slider for precise angle control (0° - 180°)
- Click preset buttons for common positions
- Real-time feedback shows current servo position
- Responsive design works on desktop and mobile devices

## API Endpoints

- `GET /` - Main control interface
- `POST /set_angle` - Set servo angle (JSON: `{"angle": 90}`)
- `GET /get_position` - Get current servo position

## Configuration

Edit `config.py` to modify:
- Servo channel assignment
- PWM frequency settings
- Web server host/port
- Pulse width ranges

## Activate venv
source venv/bin/activate