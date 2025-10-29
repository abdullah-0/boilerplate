#!/usr/bin/env python
import os
import sys
from pathlib import Path


if __name__ == "__main__":
    # Ensure the repository root is on sys.path for shared configuration modules.
    root_dir = Path(__file__).resolve().parent.parent
    sys.path.append(str(root_dir))

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)
