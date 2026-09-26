"""Database Connection and Transaction Manager supporting both Supabase PostgreSQL and SQLite."""
import sqlite3
import threading
from contextlib import contextmanager
from typing import Generator, Any, Optional, Dict, List
from backend.core.config import settings

_pg_pool = None
_pool_lock = threading.Lock()


def get_pg_pool():
    global _pg_pool
    if _pg_pool is None:
        with _pool_lock:
            if _pg_pool is None:
                import psycopg2.pool
                db_url = settings.DATABASE_URL
                _pg_pool = psycopg2.pool.ThreadedConnectionPool(minconn=1, maxconn=10, dsn=db_url)
    return _pg_pool


def convert_sql_placeholders(sql: str) -> str:
    """Translates SQLite ? parameter placeholders into PostgreSQL %s placeholders and escapes literal % as %%."""
    out = []
    in_quote = False
    for ch in sql:
        if ch == "'":
            in_quote = not in_quote
            out.append(ch)
        elif ch == '?' and not in_quote:
            out.append('%s')
        elif ch == '%':
            out.append('%%')
        else:
            out.append(ch)
    return "".join(out)


class PostgresCursorAdapter:
    def __init__(self, raw_cursor):
        self.cursor = raw_cursor
        self.lastrowid = None

    def execute(self, sql: str, params=None):
        clean_sql = convert_sql_placeholders(sql)
        stripped = clean_sql.strip()
        is_insert = stripped.upper().startswith("INSERT INTO")
        has_returning = "RETURNING" in stripped.upper()
        appended_returning = False

        if is_insert and not has_returning and not stripped.upper().startswith("INSERT INTO SETTINGS"):
            clean_sql = stripped.rstrip(";") + " RETURNING id;"
            appended_returning = True

        if params is not None:
            if isinstance(params, list):
                params = tuple(params)
            self.cursor.execute(clean_sql, params)
        else:
            self.cursor.execute(clean_sql)

        if appended_returning:
            try:
                row = self.cursor.fetchone()
                if row:
                    self.lastrowid = row[0] if isinstance(row, (tuple, list)) else row.get("id")
            except Exception:
                self.lastrowid = None

        return self

    def fetchone(self) -> Optional[Dict[str, Any]]:
        row = self.cursor.fetchone()
        if row is None:
            return None
        return dict(row)

    def fetchall(self) -> List[Dict[str, Any]]:
        rows = self.cursor.fetchall()
        return [dict(r) for r in rows]

    def __iter__(self):
        return iter(self.fetchall())


class PostgresConnectionAdapter:
    def __init__(self, raw_conn, pool=None):
        self.raw_conn = raw_conn
        self.pool = pool

    def execute(self, sql: str, params=None):
        cur = self.cursor()
        cur.execute(sql, params)
        return cur

    def cursor(self):
        from psycopg2.extras import DictCursor
        return PostgresCursorAdapter(self.raw_conn.cursor(cursor_factory=DictCursor))

    def commit(self):
        try:
            if self.raw_conn and getattr(self.raw_conn, "closed", 0) == 0:
                self.raw_conn.commit()
        except Exception:
            pass

    def rollback(self):
        try:
            if self.raw_conn and getattr(self.raw_conn, "closed", 0) == 0:
                self.raw_conn.rollback()
        except Exception:
            pass

    def close(self):
        if self.pool and self.raw_conn:
            try:
                is_closed = getattr(self.raw_conn, "closed", 0) != 0
                self.pool.putconn(self.raw_conn, close=is_closed)
            except Exception:
                pass
        elif self.raw_conn:
            try:
                self.raw_conn.close()
            except Exception:
                pass


def dict_factory(cursor: sqlite3.Cursor, row: tuple) -> dict:
    """Row factory to convert SQLite rows to standard Python dictionaries."""
    fields = [col[0] for col in cursor.description]
    return {key: value for key, value in zip(fields, row)}


def get_sqlite_connection(db_path: str = None) -> sqlite3.Connection:
    """Creates a configured SQLite connection with foreign keys and WAL mode."""
    target_path = db_path or settings.DB_PATH
    conn = sqlite3.connect(target_path, timeout=10.0, check_same_thread=False)
    conn.row_factory = dict_factory
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    return conn


@contextmanager
def get_db(db_path: str = None) -> Generator[Any, None, None]:
    """Context manager for database operations supporting Supabase PostgreSQL and SQLite."""
    is_custom_test_sqlite = bool(db_path and db_path != settings.DB_PATH and db_path != str(settings.DB_PATH))
    has_postgres = bool(settings.DATABASE_URL and (settings.DATABASE_URL.startswith("postgresql://") or settings.DATABASE_URL.startswith("postgres://")))

    if has_postgres and not is_custom_test_sqlite:
        pool = get_pg_pool()
        raw_conn = pool.getconn()
        conn = PostgresConnectionAdapter(raw_conn, pool=pool)
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    else:
        conn = get_sqlite_connection(db_path)
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
