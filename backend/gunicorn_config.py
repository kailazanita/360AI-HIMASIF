import os

# Use environment variables so Railway's assigned PORT is respected
port = os.environ.get("PORT", "10000")
bind = f"0.0.0.0:{port}"

# Allow tuning workers/timeout via environment variables
workers = int(os.environ.get("GUNICORN_WORKERS", "2"))
timeout = int(os.environ.get("GUNICORN_TIMEOUT", "120"))