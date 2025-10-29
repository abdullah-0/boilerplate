import os
from pathlib import Path

from django.core.asgi import get_asgi_application

root_dir = Path(__file__).resolve().parents[2]
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
os.environ.setdefault("PYTHONPATH", str(root_dir))

application = get_asgi_application()
