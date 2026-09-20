"""Script to create a timestamped backup of the SQLite database."""
import shutil
import sys
from datetime import datetime
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.core.config import settings


def backup():
    source_db = Path(settings.DB_PATH)
    if not source_db.exists():
        print(f"Error: Database file does not exist at {source_db}")
        return

    backup_dir = ROOT_DIR / "database" / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    dest_file = backup_dir / f"vce_{timestamp}.db"

    shutil.copy2(source_db, dest_file)
    print(f"Successfully backed up database to: {dest_file}")


if __name__ == "__main__":
    backup()
