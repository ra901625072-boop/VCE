"""Reusable parameterized SQL queries and helper routines."""
import sqlite3
from typing import List, Dict, Any, Optional
from backend.utils.dates import now_utc_iso


def log_activity(conn: sqlite3.Connection, entity_type: str, entity_id: int, action: str, description: str) -> None:
    """Inserts a record into the activity_log timeline."""
    conn.execute(
        "INSERT INTO activity_log (timestamp, entity_type, entity_id, action, description) VALUES (?, ?, ?, ?, ?)",
        (now_utc_iso(), entity_type, entity_id, action, description)
    )


def get_work_with_balances(conn: sqlite3.Connection, work_id: int) -> Optional[Dict[str, Any]]:
    """Fetches a work item and calculates received and pending amounts dynamically."""
    query = """
    SELECT 
        w.*,
        p.name AS person_name,
        p.phone AS person_phone,
        p.village AS person_village,
        COALESCE(SUM(CASE WHEN pay.payment_status = 'received' AND LOWER(pay.payment_method) != 'udhar' THEN pay.amount ELSE 0 END), 0) AS received_amount,
        COALESCE(SUM(CASE WHEN LOWER(pay.payment_method) = 'udhar' THEN pay.amount ELSE 0 END), 0) AS udhar_payments_amount
    FROM work w
    JOIN people p ON w.person_id = p.id
    LEFT JOIN payments pay ON pay.work_id = w.id
    WHERE w.id = ?
    GROUP BY w.id, p.id;
    """
    cur = conn.execute(query, (work_id,))
    row = cur.fetchone()
    if not row:
        return None
    
    agreed = row["agreed_amount"]
    received = row["received_amount"]
    pending = max(0, agreed - received)
    row["pending_amount"] = pending
    return row


def get_person_financial_summary(conn: sqlite3.Connection, person_id: int) -> Dict[str, Any]:
    """Calculates all-time financial statistics for a specific person."""
    work_query = """
    SELECT 
        COUNT(id) AS work_count,
        COALESCE(SUM(CASE WHEN status != 'Cancelled' THEN agreed_amount ELSE 0 END), 0) AS total_agreed,
        COALESCE(SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END), 0) AS completed_work_count,
        COALESCE(SUM(CASE WHEN status NOT IN ('Completed', 'Cancelled') THEN 1 ELSE 0 END), 0) AS active_work_count
    FROM work
    WHERE person_id = ? AND is_archived = 0;
    """
    w_row = conn.execute(work_query, (person_id,)).fetchone() or {}
    total_agreed = int(w_row.get("total_agreed") or 0)
    work_count = int(w_row.get("work_count") or 0)
    active_work_count = int(w_row.get("active_work_count") or 0)
    completed_work_count = int(w_row.get("completed_work_count") or 0)

    pay_query = """
    SELECT 
        COALESCE(SUM(CASE WHEN payment_status = 'received' AND LOWER(payment_method) != 'udhar' THEN amount ELSE 0 END), 0) AS total_received,
        COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'udhar' AND work_id IS NULL THEN amount ELSE 0 END), 0) AS direct_udhar,
        MAX(payment_date) AS last_payment_date
    FROM payments
    WHERE person_id = ?;
    """
    p_row = conn.execute(pay_query, (person_id,)).fetchone() or {}
    total_received = int(p_row.get("total_received") or 0)
    direct_udhar = int(p_row.get("direct_udhar") or 0)

    total_pending = max(0, total_agreed - total_received) + direct_udhar
    total_agreed = total_agreed + direct_udhar

    return {
        "work_count": work_count,
        "active_work_count": active_work_count,
        "completed_work_count": completed_work_count,
        "total_agreed": total_agreed,
        "total_received": total_received,
        "total_pending": total_pending,
        "last_payment_date": p_row.get("last_payment_date")
    }
