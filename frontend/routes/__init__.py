from flask import Blueprint

# Create blueprint for routes
routes_bp = Blueprint('routes', __name__)

# Import route modules to register them
from . import index, api, webcam