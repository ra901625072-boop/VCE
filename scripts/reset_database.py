"""Script to safely reset and re-initialize the SQLite database."""
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.core.config import settings
from backend.database.migrations import init_db


def reset():
    db_file = Path(settings.DB_PATH)
    if db_file.exists():
        os.remove(db_file)
        print(f"Removed database at {db_file}")

    # Remove any WAL and SHM files
    for ext in ["-wal", "-shm"]:
        extra = Path(str(db_file) + ext)
        if extra.exists():
            os.remove(extra)

    init_db(settings.DB_PATH)
    print("Database schema successfully re-initialized.")


if __name__ == "__main__":
    reset()
