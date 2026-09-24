from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
API_DIR = ROOT / "apps" / "api"

sys.path.insert(0, str(API_DIR))

from app.main import app  # noqa: E402