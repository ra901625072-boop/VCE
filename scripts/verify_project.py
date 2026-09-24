"""Comprehensive Project Verification Script.
Checks implementation compliance against:
- PROJECT.md
- REQUIREMENTS.md
- ARCHITECTURE.md
"""
import sys
import sqlite3
from pathlib import Path

# Fix Windows console UTF-8 output if needed
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.core.config import settings


def verify_architecture_structure():
    print("\n--- 1. Verifying Architecture Directory Structure ---")
    required_paths = [
        # Frontend
        "frontend/index.html",
        "frontend/pages/dashboard.html",
        "frontend/pages/work.html",
        "frontend/pages/people.html",
        "frontend/pages/transactions.html",
        "frontend/pages/reports.html",
        "frontend/pages/settings.html",
        "frontend/css/reset.css",
        "frontend/css/variables.css",
        "frontend/css/layout.css",
        "frontend/css/components.css",
        "frontend/css/responsive.css",
        "frontend/js/api.js",
        "frontend/js/app.js",
        "frontend/js/dashboard.js",
        "frontend/js/work.js",
        "frontend/js/people.js",
        "frontend/js/transactions.js",
        "frontend/js/reports.js",
        "frontend/js/settings.js",
        "frontend/components/sidebar.js",
        "frontend/components/modal.js",
        "frontend/components/notification.js",
        # Backend
        "backend/main.py",
        "backend/core/config.py",
        "backend/core/security.py",
        "backend/core/validation.py",
        "backend/core/exceptions.py",
        "backend/database/connection.py",
        "backend/database/migrations.py",
        "backend/database/queries.py",
        "backend/schemas/person.py",
        "backend/schemas/work.py",
        "backend/schemas/payment.py",
        "backend/schemas/expense.py",
        "backend/schemas/savings.py",
        "backend/schemas/dashboard.py",
        "backend/schemas/settings.py",
        "backend/services/person_service.py",
        "backend/services/work_service.py",
        "backend/services/payment_service.py",
        "backend/services/expense_service.py",
        "backend/services/dashboard_service.py",
        "backend/services/report_service.py",
        "backend/services/search_service.py",
        "backend/services/settings_service.py",
        "backend/utils/money.py",
        "backend/utils/dates.py",
        "backend/utils/exports.py",
        "backend/api/people.py",
        "backend/api/work.py",
        "backend/api/payments.py",
        "backend/api/expenses.py",
        "backend/api/savings.py",
        "backend/api/dashboard.py",
        "backend/api/search.py",
        "backend/api/reports.py",
        "backend/api/settings.py",
        # Database
        "database/seeds/default_categories.json",
        "database/seeds/demo_data.json",
        "database/backups/.gitkeep",
        "database/README.md",
        # Documentation
        "docs/API.md",
        "docs/DATABASE.md",
        "docs/DEPLOYMENT.md",
        "docs/SECURITY.md",
        "docs/USER_GUIDE.md",
        # Scripts
        "scripts/setup.bat",
        "scripts/run.bat",
        "scripts/seed_database.py",
        "scripts/backup_database.py",
        "scripts/reset_database.py",
        # Root files
        "README.md",
        "run.bat",
        ".env.example",
        ".env",
        ".gitignore",
        "pytest.ini"
    ]

    all_ok = True
    for p in required_paths:
        target = ROOT_DIR / p
        if not target.exists():
            print(f"  [MISSING] {p}")
            all_ok = False
        else:
            pass

    if all_ok:
        print(f"  [PASS] All {len(required_paths)} required architecture files and directories exist!")
    return all_ok


def verify_database_schema():
    print("\n--- 2. Verifying SQLite Database & Schema Rules ---")
    db_file = Path(settings.DB_PATH)
    if not db_file.exists():
        print(f"  [FAIL] Database file not found at {db_file}")
        return False

    conn = sqlite3.connect(db_file)
    cur = conn.cursor()

    # Verify tables
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cur.fetchall()]
    required_tables = [
        "people", "work", "payments", "expenses", "savings",
        "work_categories", "work_statuses", "payment_methods",
        "expense_categories", "activity_log", "settings"
    ]
    for t in required_tables:
        if t not in tables:
            print(f"  [FAIL] Missing table: {t}")
            return False

    print(f"  [PASS] All {len(required_tables)} relational tables verified in SQLite database.")

    # Verify Indexes
    cur.execute("SELECT name FROM sqlite_master WHERE type='index';")
    indexes = [r[0] for r in cur.fetchall()]
    required_indexes = [
        "idx_people_name", "idx_work_person_id", "idx_work_status",
        "idx_payments_person_id", "idx_payments_work_id", "idx_payments_method",
        "idx_payments_date", "idx_expenses_date"
    ]
    for idx in required_indexes:
        if idx not in indexes:
            print(f"  [FAIL] Missing index: {idx}")
            return False

    print(f"  [PASS] All {len(required_indexes)} performance indexes verified.")
    conn.close()
    return True


def run_all_checks():
    print("====================================================")
    print("  VCE WORK & MONEY FLOW TRACKER — VERIFICATION SUITE")
    print("====================================================")
    arch_ok = verify_architecture_structure()
    db_ok = verify_database_schema()

    if arch_ok and db_ok:
        print("\n====================================================")
        print("  ALL ARCHITECTURE & COMPLIANCE CHECKS PASSED!")
        print("====================================================")
        return 0
    else:
        print("\nSome verification checks failed. Review output above.")
        return 1


if __name__ == "__main__":
    sys.exit(run_all_checks())
