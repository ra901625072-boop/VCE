"""Database migrations and initial schema setup for VCE Pali e-Gram Ledger."""
import sqlite3
from backend.database.connection import get_db
from backend.utils.dates import now_utc_iso
from backend.core.security import hash_password
from backend.core.config import settings


SCHEMA_SQL = """
-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    full_name TEXT DEFAULT 'Akshay Rajput',
    role TEXT DEFAULT 'VCE Operator',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);


-- People / Citizens Table
CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    company TEXT,
    address TEXT,
    notes TEXT,
    tags TEXT,
    village TEXT DEFAULT '',
    aadhaar_last4 TEXT DEFAULT '',
    ration_card_no TEXT DEFAULT '',
    khata_no TEXT DEFAULT '',
    citizen_type TEXT DEFAULT 'General',
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Work Categories Table
CREATE TABLE IF NOT EXISTS work_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

-- Work Statuses Table
CREATE TABLE IF NOT EXISTS work_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    color TEXT NOT NULL DEFAULT '#64748b',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_default INTEGER NOT NULL DEFAULT 0
);

-- Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    is_system INTEGER NOT NULL DEFAULT 0,
    is_default INTEGER NOT NULL DEFAULT 0
);

-- Expense Categories Table
CREATE TABLE IF NOT EXISTS expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

-- Work / Applications Table (Agreed amount in integer paise)
CREATE TABLE IF NOT EXISTS work (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    agreed_amount INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'New',
    priority TEXT NOT NULL DEFAULT 'Medium',
    start_date TEXT,
    deadline TEXT,
    completed_date TEXT,
    notes TEXT,
    service_category TEXT DEFAULT 'General',
    service_name TEXT DEFAULT '',
    portal_name TEXT DEFAULT '',
    token_no TEXT DEFAULT '',
    ack_no TEXT DEFAULT '',
    portal_cost INTEGER NOT NULL DEFAULT 0,
    panchayat_share INTEGER NOT NULL DEFAULT 0,
    vce_commission INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE RESTRICT
);

-- Payments Table (Amount in integer paise)
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id INTEGER NOT NULL,
    work_id INTEGER,
    amount INTEGER NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'received',
    transaction_reference TEXT,
    payment_date TEXT NOT NULL,
    payment_time TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE RESTRICT,
    FOREIGN KEY (work_id) REFERENCES work(id) ON DELETE SET NULL
);

-- Expenses Table (Amount in integer paise)
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    amount INTEGER NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Cash',
    expense_date TEXT NOT NULL,
    expense_time TEXT NOT NULL,
    vendor TEXT,
    work_id INTEGER,
    receipt_ref TEXT,
    notes TEXT,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (work_id) REFERENCES work(id) ON DELETE SET NULL
);

-- Savings Table (Amounts in integer paise)
CREATE TABLE IF NOT EXISTS savings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    target_amount INTEGER NOT NULL DEFAULT 0,
    saved_amount INTEGER NOT NULL DEFAULT 0,
    target_date TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Activity Log / Timeline Table
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Portal Wallets Table (Tracks prepaid portal balances in integer paise)
CREATE TABLE IF NOT EXISTS portal_wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    portal_name TEXT UNIQUE NOT NULL,
    current_balance INTEGER NOT NULL DEFAULT 0,
    min_alert_balance INTEGER NOT NULL DEFAULT 10000,
    last_recharge_date TEXT,
    updated_at TEXT NOT NULL
);

-- Wallet Transactions Table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL DEFAULT 0,
    reference_no TEXT,
    transaction_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (wallet_id) REFERENCES portal_wallets(id) ON DELETE CASCADE
);

-- Department Work Orders Table (State Govt Tasks Mandated ₹20/unit rate)
CREATE TABLE IF NOT EXISTS dept_work_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dept_name TEXT NOT NULL,
    scheme_name TEXT NOT NULL,
    order_ref TEXT,
    target_units INTEGER NOT NULL DEFAULT 0,
    completed_units INTEGER NOT NULL DEFAULT 0,
    unit_rate INTEGER NOT NULL DEFAULT 2000,
    total_claim_amount INTEGER NOT NULL DEFAULT 0,
    amount_received INTEGER NOT NULL DEFAULT 0,
    tds_deducted INTEGER NOT NULL DEFAULT 0,
    disallowed_amount INTEGER NOT NULL DEFAULT 0,
    claim_status TEXT NOT NULL DEFAULT 'In Progress',
    order_date TEXT,
    submission_date TEXT,
    disbursement_date TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Gram Panchayat Remittances (Settlement of Panchayat Share Payable)
CREATE TABLE IF NOT EXISTS panchayat_remittances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount INTEGER NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Cash',
    remittance_date TEXT NOT NULL,
    talati_receipt_no TEXT NOT NULL,
    period_from TEXT,
    period_to TEXT,
    notes TEXT,
    created_at TEXT NOT NULL
);

-- Rojmel Day Closing & Cash Denomination Reconciliations
CREATE TABLE IF NOT EXISTS rojmel_day_closes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    close_date TEXT UNIQUE NOT NULL,
    system_closing_cash INTEGER NOT NULL,
    physical_cash_total INTEGER NOT NULL,
    cash_variance INTEGER NOT NULL DEFAULT 0,
    denominations_json TEXT NOT NULL DEFAULT '{}',
    is_locked INTEGER NOT NULL DEFAULT 1,
    closed_by TEXT NOT NULL DEFAULT 'VCE Operator',
    notes TEXT,
    created_at TEXT NOT NULL
);

-- Gram Panchayat Profile Table
CREATE TABLE IF NOT EXISTS panchayat_profile (
    id INTEGER PRIMARY KEY DEFAULT 1,
    district TEXT NOT NULL DEFAULT '',
    taluka TEXT NOT NULL DEFAULT '',
    gram_panchayat TEXT NOT NULL DEFAULT '',
    center_id TEXT NOT NULL DEFAULT '',
    vce_name TEXT NOT NULL DEFAULT '',
    vce_phone TEXT NOT NULL DEFAULT '',
    talati_name TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_people_name ON people(name);
CREATE INDEX IF NOT EXISTS idx_people_phone ON people(phone);
CREATE INDEX IF NOT EXISTS idx_work_person_id ON work(person_id);
CREATE INDEX IF NOT EXISTS idx_work_status ON work(status);
CREATE INDEX IF NOT EXISTS idx_work_deadline ON work(deadline);
CREATE INDEX IF NOT EXISTS idx_work_created_at ON work(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_person_id ON payments(person_id);
CREATE INDEX IF NOT EXISTS idx_payments_work_id ON payments(work_id);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON payments(amount);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(amount);
CREATE INDEX IF NOT EXISTS idx_panchayat_remittances_date ON panchayat_remittances(remittance_date);
CREATE INDEX IF NOT EXISTS idx_rojmel_day_closes_date ON rojmel_day_closes(close_date);
"""


def _migrate_columns(conn: sqlite3.Connection) -> None:
    """Safely adds new columns to existing tables if upgrading from older schema."""
    cursor = conn.cursor()
    
    # Check people columns
    cursor.execute("PRAGMA table_info(people)")
    existing_people_cols = {dict(row)["name"] for row in cursor.fetchall()}
    people_cols_to_add = [
        ("village", "TEXT DEFAULT ''"),
        ("aadhaar_last4", "TEXT DEFAULT ''"),
        ("ration_card_no", "TEXT DEFAULT ''"),
        ("khata_no", "TEXT DEFAULT ''"),
        ("citizen_type", "TEXT DEFAULT 'General'")
    ]
    for col_name, col_def in people_cols_to_add:
        if col_name not in existing_people_cols:
            cursor.execute(f"ALTER TABLE people ADD COLUMN {col_name} {col_def}")

    # Check work columns
    cursor.execute("PRAGMA table_info(work)")
    existing_work_cols = {dict(row)["name"] for row in cursor.fetchall()}
    work_cols_to_add = [
        ("service_category", "TEXT DEFAULT 'General'"),
        ("service_name", "TEXT DEFAULT ''"),
        ("portal_name", "TEXT DEFAULT ''"),
        ("token_no", "TEXT DEFAULT ''"),
        ("ack_no", "TEXT DEFAULT ''"),
        ("portal_cost", "INTEGER NOT NULL DEFAULT 0"),
        ("panchayat_share", "INTEGER NOT NULL DEFAULT 0"),
        ("vce_commission", "INTEGER NOT NULL DEFAULT 0")
    ]
    for col_name, col_def in work_cols_to_add:
        if col_name not in existing_work_cols:
            cursor.execute(f"ALTER TABLE work ADD COLUMN {col_name} {col_def}")

    # Check dept_work_orders columns
    cursor.execute("PRAGMA table_info(dept_work_orders)")
    existing_dept_cols = {dict(row)["name"] for row in cursor.fetchall()}
    dept_cols_to_add = [
        ("tds_deducted", "INTEGER NOT NULL DEFAULT 0"),
        ("disallowed_amount", "INTEGER NOT NULL DEFAULT 0")
    ]
    for col_name, col_def in dept_cols_to_add:
        if col_name not in existing_dept_cols:
            cursor.execute(f"ALTER TABLE dept_work_orders ADD COLUMN {col_name} {col_def}")

    # Check users columns
    cursor.execute("PRAGMA table_info(users)")
    existing_user_cols = {dict(row)["name"] for row in cursor.fetchall()}
    user_cols_to_add = [
        ("full_name", "TEXT DEFAULT 'Akshay Rajput'"),
        ("role", "TEXT DEFAULT 'VCE Operator'"),
        ("is_active", "INTEGER NOT NULL DEFAULT 1")
    ]
    for col_name, col_def in user_cols_to_add:
        if col_name not in existing_user_cols:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_people_village ON people(village)")


def is_postgres() -> bool:
    return bool(settings.DATABASE_URL and (settings.DATABASE_URL.startswith("postgresql://") or settings.DATABASE_URL.startswith("postgres://")))


def init_postgres(conn, now: str) -> None:
    """Initializes tables and seeds default data in PostgreSQL/Supabase."""
    from backend.core.security import hash_password
    default_op_id = getattr(settings, "DEFAULT_OPERATOR_ID", "akrajput2005")
    default_op_pass = getattr(settings, "DEFAULT_OPERATOR_PASS", "Akshay@05")
    existing_user = conn.execute("SELECT id, password_hash, salt FROM users WHERE LOWER(username) = LOWER(?)", (default_op_id,)).fetchone()
    if not existing_user:
        hashed_pw, salt = hash_password(default_op_pass)
        conn.execute(
            """INSERT INTO users (username, password_hash, salt, full_name, role, is_active, created_at)
               VALUES (?, ?, ?, ?, ?, 1, ?) ON CONFLICT (username) DO NOTHING""",
            (default_op_id, hashed_pw, salt, "Akshay Rajput", "VCE Operator", now)
        )
    else:
        # Auto-heal corrupted tuple string or bad hash format if present
        raw_hash = existing_user.get("password_hash", "")
        raw_salt = existing_user.get("salt", "")
        if raw_hash.startswith("(") or "," in raw_hash or raw_salt.startswith("("):
            clean_hash = raw_hash.strip("()\"' ").split(",")[0].strip("\"' ")
            clean_salt = raw_salt.strip("()\"' ").split(",")[-1].strip("\"' ")
            conn.execute(
                "UPDATE users SET password_hash = ?, salt = ? WHERE id = ?",
                (clean_hash, clean_salt, existing_user["id"])
            )

    default_methods = [
        ("Online", 1, 1),
        ("Cash", 1, 0),
        ("Udhar", 1, 0),
        ("UPI", 0, 0),
        ("Bank Transfer", 0, 0),
        ("Cheque", 0, 0),
    ]
    for name, is_system, is_def in default_methods:
        conn.execute(
            "INSERT INTO payment_methods (name, is_system, is_default) VALUES (?, ?, ?) ON CONFLICT (name) DO NOTHING",
            (name, is_system, is_def)
        )

    default_statuses = [
        ("New", "#3b82f6", 1, 1),
        ("In Progress", "#f59e0b", 2, 0),
        ("Pending Approval", "#8b5cf6", 3, 0),
        ("Ready / Printed", "#06b6d4", 4, 0),
        ("Completed / Delivered", "#10b981", 5, 0),
        ("Cancelled / Rejected", "#ef4444", 6, 0),
    ]
    for name, color, order, is_def in default_statuses:
        conn.execute(
            "INSERT INTO work_statuses (name, color, sort_order, is_default) VALUES (?, ?, ?, ?) ON CONFLICT (name) DO NOTHING",
            (name, color, order, is_def)
        )

    default_work_cats = [
        "AnyRoR Land Records (7/12 & 8-A)",
        "Digital Gujarat Certificates",
        "Farmer & iKhedut / PM-Kisan",
        "Civil Supplies & Ration Card",
        "Panchayat & Civic Services",
        "Identity & Ayushman Card",
        "Utility Bills & CSC Services",
        "State Dept Work Orders (₹20/Unit)",
        "General Digital Services"
    ]
    for cat in default_work_cats:
        conn.execute(
            "INSERT INTO work_categories (name, is_default, created_at) VALUES (?, 1, ?) ON CONFLICT (name) DO NOTHING",
            (cat, now)
        )

    default_exp_cats = [
        "Paper Reams (A4 / Legal)",
        "Printer Toner & Drum Refill",
        "Broadband & Internet Recharge",
        "Lamination Film & Stationery",
        "Hardware & Scanner Maintenance",
        "Electricity & Power Backup",
        "Center Hospitality & Refreshments",
        "Panchayat & Duty Travel",
        "Other Center Expenses"
    ]
    for cat in default_exp_cats:
        conn.execute(
            "INSERT INTO expense_categories (name, is_default, created_at) VALUES (?, 1, ?) ON CONFLICT (name) DO NOTHING",
            (cat, now)
        )

    default_wallets = [
        ("Digital Gujarat Portal", 0, 10000),
        ("AnyRoR Land Records", 0, 10000),
        ("CSC Digital Seva", 0, 20000),
        ("Discom Electricity Float", 0, 50000)
    ]
    for pname, bal, mbal in default_wallets:
        conn.execute(
            "INSERT INTO portal_wallets (portal_name, current_balance, min_alert_balance, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (portal_name) DO NOTHING",
            (pname, bal, mbal, now)
        )

    conn.execute(
        """INSERT INTO panchayat_profile 
           (id, district, taluka, gram_panchayat, center_id, vce_name, vce_phone, talati_name, updated_at)
           VALUES (1, '', '', '', '', '', '', '', ?) ON CONFLICT (id) DO NOTHING""",
        (now,)
    )

    default_settings = {
        "app_title": "VCE Pali — e-Gram Seva & Financial Ledger",
        "currency": "INR",
        "currency_symbol": "₹",
        "date_format": "YYYY-MM-DD",
        "accounting_mode": "cash_flow",
        "theme": "slate",
        "vce_min_govt_rate": "20.00",
        "state": "Gujarat",
    }
    for key, val in default_settings.items():
        conn.execute(
            "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT (key) DO NOTHING",
            (key, val, now)
        )


def init_db(db_path: str = None) -> None:
    """Initializes the database schema, handles column migrations, and inserts default lookup data."""
    now = now_utc_iso()
    with get_db(db_path) as conn:
        if is_postgres():
            init_postgres(conn, now)
            return

        conn.executescript(SCHEMA_SQL)
        _migrate_columns(conn)

        # Seed Default Operator Account
        default_op_id = getattr(settings, "DEFAULT_OPERATOR_ID", "akrajput2005")
        default_op_pass = getattr(settings, "DEFAULT_OPERATOR_PASS", "Akshay@05")
        existing_user = conn.execute("SELECT id FROM users WHERE username = ?", (default_op_id,)).fetchone()
        if not existing_user:
            hashed_pw, salt = hash_password(default_op_pass)
            conn.execute(
                """INSERT INTO users (username, password_hash, salt, full_name, role, is_active, created_at)
                   VALUES (?, ?, ?, ?, ?, 1, ?)""",
                (default_op_id, hashed_pw, salt, "Akshay Rajput", "VCE Operator", now)
            )

        # Default Payment Methods
        default_methods = [
            ("Online", 1, 1),
            ("Cash", 1, 0),
            ("Udhar", 1, 0),
            ("UPI", 0, 0),
            ("Bank Transfer", 0, 0),
            ("Cheque", 0, 0),
        ]
        for name, is_system, is_def in default_methods:
            conn.execute(
                "INSERT OR IGNORE INTO payment_methods (name, is_system, is_default) VALUES (?, ?, ?)",
                (name, is_system, is_def)
            )

        # Default Work Statuses (aligned with e-Gram workflow)
        default_statuses = [
            ("New", "#3b82f6", 1, 1),
            ("In Progress", "#f59e0b", 2, 0),
            ("Pending Approval", "#8b5cf6", 3, 0),
            ("Ready / Printed", "#06b6d4", 4, 0),
            ("Completed / Delivered", "#10b981", 5, 0),
            ("Cancelled / Rejected", "#ef4444", 6, 0),
        ]
        for name, color, order, is_def in default_statuses:
            conn.execute(
                "INSERT OR IGNORE INTO work_statuses (name, color, sort_order, is_default) VALUES (?, ?, ?, ?)",
                (name, color, order, is_def)
            )

        # Default VCE Pali Service Categories
        default_work_cats = [
            "AnyRoR Land Records (7/12 & 8-A)",
            "Digital Gujarat Certificates",
            "Farmer & iKhedut / PM-Kisan",
            "Civil Supplies & Ration Card",
            "Panchayat & Civic Services",
            "Identity & Ayushman Card",
            "Utility Bills & CSC Services",
            "State Dept Work Orders (₹20/Unit)",
            "General Digital Services"
        ]
        for cat in default_work_cats:
            conn.execute(
                "INSERT OR IGNORE INTO work_categories (name, is_default, created_at) VALUES (?, 1, ?)",
                (cat, now)
            )

        # Default e-Gram Center Expense Categories
        default_exp_cats = [
            "Paper Reams (A4 / Legal)",
            "Printer Toner & Drum Refill",
            "Broadband & Internet Recharge",
            "Lamination Film & Stationery",
            "Hardware & Scanner Maintenance",
            "Electricity & Power Backup",
            "Center Hospitality & Refreshments",
            "Panchayat & Duty Travel",
            "Other Center Expenses"
        ]
        for cat in default_exp_cats:
            conn.execute(
                "INSERT OR IGNORE INTO expense_categories (name, is_default, created_at) VALUES (?, 1, ?)",
                (cat, now)
            )

        # Default Portal Wallets (Starting at ₹0.00 float)
        default_wallets = [
            ("Digital Gujarat Portal", 0, 10000),      # ₹0 initial, ₹100 alert
            ("AnyRoR Land Records", 0, 10000),         # ₹0 initial, ₹100 alert
            ("CSC Digital Seva", 0, 20000),           # ₹0 initial, ₹200 alert
            ("Discom Electricity Float", 0, 50000)    # ₹0 initial, ₹500 alert
        ]
        for pname, bal, mbal in default_wallets:
            conn.execute(
                "INSERT OR IGNORE INTO portal_wallets (portal_name, current_balance, min_alert_balance, updated_at) VALUES (?, ?, ?, ?)",
                (pname, bal, mbal, now)
            )

        # Default Panchayat Profile (Clean unconfigured profile ready for operator setup)
        conn.execute(
            """INSERT OR IGNORE INTO panchayat_profile 
               (id, district, taluka, gram_panchayat, center_id, vce_name, vce_phone, talati_name, updated_at)
               VALUES (1, '', '', '', '', '', '', '', ?)""",
            (now,)
        )

        # Default Application Settings
        default_settings = {
            "app_title": "VCE Pali — e-Gram Seva & Financial Ledger",
            "currency": "INR",
            "currency_symbol": "₹",
            "date_format": "YYYY-MM-DD",
            "accounting_mode": "cash_flow",
            "theme": "slate",
            "vce_min_govt_rate": "20.00",
            "state": "Gujarat",
        }
        for key, val in default_settings.items():
            conn.execute(
                "INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)",
                (key, val, now)
            )
