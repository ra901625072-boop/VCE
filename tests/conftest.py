"""Pytest fixtures and configuration."""
import os
import tempfile
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from backend.database.migrations import init_db
from backend.main import app
from backend.core.config import settings
from backend.services.person_service import PersonService
from backend.services.work_service import WorkService
from backend.services.payment_service import PaymentService
from backend.services.expense_service import ExpenseService
from backend.services.savings_service import SavingsService
from backend.services.dashboard_service import DashboardService
from backend.services.report_service import ReportService
from backend.services.search_service import SearchService


@pytest.fixture
def temp_db():
    """Creates an isolated temporary SQLite database for a test run."""
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


@pytest.fixture
def client(temp_db):
    """TestClient that points to the temporary database."""
    old_db = settings.DB_PATH
    settings.DB_PATH = temp_db
    with TestClient(app) as c:
        yield c
    settings.DB_PATH = old_db
