import os
import psycopg2
from backend.core.config import settings

DATABASE_URL = os.getenv("DATABASE_URL") or settings.DATABASE_URL

def restore_data():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    print("Restoring citizen records into Supabase...")
    people = [
        (1, "કનુભાઈ પટેલ", "9427465591", "ભગવતી પરુ", "533", "", "Farmer", "2026-09-21 06:59:33", "2026-09-21 06:59:33"),
        (2, "વિક્રમ રાજપુત", "9904385949", "રાજપુતવાસ", "", "104003014484078", "Farmer", "2026-09-21 07:06:12", "2026-09-21 07:06:12")
    ]
    for p in people:
        cur.execute(
            """INSERT INTO people (id, name, phone, village, khata_no, ration_card_no, citizen_type, is_archived, created_at, updated_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, 0, %s, %s)
               ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone;""",
            p
        )
    cur.execute("SELECT setval(pg_get_serial_sequence('people', 'id'), 2);")

    print("Restoring application work records into Supabase...")
    cur.execute(
        """INSERT INTO work (
            id, person_id, title, category, agreed_amount, status, priority, start_date,
            service_category, service_name, portal_name, token_no, ack_no, portal_cost,
            panchayat_share, vce_commission, is_archived, created_at, updated_at
        ) VALUES (
            1, 2, 'iKhedut Scheme Subsidy Application', 'General', 35000, 'In Progress', 'Medium',
            '2026-09-21', 'Farmer & iKhedut / PM-Kisan', 'iKhedut Scheme Subsidy Application',
            'iKhedut', 'TK-20260921-2982', '', 0, 0, 35000, 0, '2026-09-21 07:08:42', '2026-09-21 07:08:42'
        ) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, agreed_amount = EXCLUDED.agreed_amount;"""
    )
    cur.execute("SELECT setval(pg_get_serial_sequence('work', 'id'), 1);")

    print("Restoring payment records into Supabase...")
    cur.execute(
        """INSERT INTO payments (
            id, person_id, work_id, amount, payment_method, payment_status,
            payment_date, payment_time, notes, created_at, updated_at
        ) VALUES (
            1, 1, NULL, 1500, 'Udhar', 'received', '2026-09-21', '12:29:50', '7/12 & 8a',
            '2026-09-21 07:00:51', '2026-09-21 07:00:51'
        ) ON CONFLICT (id) DO UPDATE SET amount = EXCLUDED.amount;"""
    )
    cur.execute("SELECT setval(pg_get_serial_sequence('payments', 'id'), 1);")

    print("Verifying Supabase records:")
    cur.execute("SELECT id, name, village FROM people;")
    print("People in Supabase:", cur.fetchall())
    cur.execute("SELECT id, title, agreed_amount FROM work;")
    print("Work in Supabase:", cur.fetchall())
    cur.execute("SELECT id, amount, payment_method, notes FROM payments;")
    print("Payments in Supabase:", cur.fetchall())

    conn.close()
    print("Data restored to Supabase successfully!")

if __name__ == "__main__":
    restore_data()
