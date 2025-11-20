from flask import render_template
from . import routes_bp

@routes_bp.route('/')
def index():
    """Serve the main control interface"""
    return render_template('index.html')