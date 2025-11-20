from flask import render_template
from . import routes_bp

@routes_bp.route('/health')
def health_page():
    """Serve the health monitoring page"""
    return render_template('health.html')