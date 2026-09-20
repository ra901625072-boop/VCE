"""SQLite Connection and transaction manager."""
import sqlite3
import threading
from contextlib import contextmanager
from typing import Generator
from backend.core.config import settings

# Thread-local storage for connections if needed
_local = threading.local()


def dict_factory(cursor: sqlite3.Cursor, row: tuple) -> dict:
    """Row factory to convert SQLite rows to standard Python dictionaries."""
    fields = [col[0] for col in cursor.description]
    return {key: value for key, value in zip(fields, row)}


def get_db_connection(db_path: str = None) -> sqlite3.Connection:
    """Creates a configured SQLite connection with foreign keys and WAL mode."""
    target_path = db_path or settings.DB_PATH
    conn = sqlite3.connect(target_path, timeout=10.0, check_same_thread=False)
    conn.row_factory = dict_factory
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    return conn


@contextmanager
def get_db(db_path: str = None) -> Generator[sqlite3.Connection, None, None]:
    """Context manager for SQLite database operations with auto-commit and rollback on error."""
    conn = get_db_connection(db_path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
