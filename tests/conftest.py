"""Pytest fixtures and configuration."""
import os
import tempfile
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from backend.database.migrations import init_db
from backend.main import app
from backend.core.config import settings


@pytest.fixture
def temp_db():
    """Creates an isolated temporary SQLite database for a test run."""
    old_url = settings.DATABASE_URL
    settings.DATABASE_URL = None
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    init_db(path)
    yield path
    try:
        os.remove(path)
        for ext in ["-wal", "-shm"]:
            wal = Path(path + ext)
            if wal.exists():
                os.remove(wal)
    except Exception:
        pass
    settings.DATABASE_URL = old_url


@pytest.fixture
def client(temp_db):
    """TestClient that points to the temporary database."""
    old_db = settings.DB_PATH
    old_url = settings.DATABASE_URL
    settings.DB_PATH = temp_db
    settings.DATABASE_URL = None
    with TestClient(app) as c:
        yield c
    settings.DB_PATH = old_db
    settings.DATABASE_URL = old_url
