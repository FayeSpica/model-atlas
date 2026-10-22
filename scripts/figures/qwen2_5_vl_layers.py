"""Regenerate the expanded qwen2-5-vl operator diagram."""
import subprocess
import sys
from pathlib import Path

subprocess.run([sys.executable, str(Path(__file__).with_name("omni_layers.py")), "qwen2-5-vl"], check=True)
