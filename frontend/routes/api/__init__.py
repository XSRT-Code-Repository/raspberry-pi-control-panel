from flask import Blueprint

# Create blueprint for API routes
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Import API route modules
from . import servos, config, health