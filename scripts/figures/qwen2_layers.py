"""Regenerate the expanded qwen2 operator diagram."""
import subprocess
import sys
from pathlib import Path

subprocess.run([sys.executable, str(Path(__file__).with_name("omni_layers.py")), "qwen2"], check=True)
