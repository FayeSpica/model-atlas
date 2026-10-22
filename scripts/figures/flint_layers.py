"""Regenerate the expanded flint operator diagram."""
import subprocess
import sys
from pathlib import Path

subprocess.run([sys.executable, str(Path(__file__).with_name("omni_layers.py")), "flint"], check=True)
