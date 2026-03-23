"""
Vercel Python Serverless Entry Point
=====================================
Vercel's @vercel/python runtime discovers the Flask `app` object
from this file. All routes defined in the parent app.py are available
under the /api/* prefix as configured in vercel.json.
"""

import sys
import os

# Make sure the backend/ directory is on the path so `from app import app` works
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the Flask application object
from app import app  # noqa: F401

# Vercel automatically detects `app` as the WSGI handler.
# No additional configuration needed.
