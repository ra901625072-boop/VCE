import os
import urllib.request
import json
import psycopg2
from backend.core.config import settings

DATABASE_URL = os.getenv("DATABASE_URL") or settings.DATABASE_URL

def get_live_data(endpoint):
    url = f"https://vce-pali-backend.onrender.com/api{endpoint}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Error fetching {endpoint}: {e}")
        return []

def migrate():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    print("Fetching live data from Render...")
    people = get_live_data("/people")
    work = get_live_data("/work")
    payments = get_live_data("/payments")

    print(f"Fetched {len(people)} people, {len(work)} work records, {len(payments)} payments.")

    # 1. Migrate People
    for p in people:
        cur.execute(
            """INSERT INTO people (
                id, name, phone, email, company, address, notes, tags, village,
                aadhaar_last4, ration_card_no, khata_no, citizen_type, is_archived,
                created_at, updated_at
            ) VALUES (
                %(id)s, %(name)s, %(phone)s, %(email)s, %(company)s, %(address)s, %(notes)s, %(tags)s, %(village)s,
                %(aadhaar_last4)s, %(ration_card_no)s, %(khata_no)s, %(citizen_type)s, 0,
                %(created_at)s, %(updated_at)s
            ) ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                phone = EXCLUDED.phone,
                village = EXCLUDED.village,
                khata_no = EXCLUDED.khata_no,
                ration_card_no = EXCLUDED.ration_card_no,
                citizen_type = EXCLUDED.citizen_type;""",
            p
        )
    if people:
        cur.execute("SELECT setval(pg_get_serial_sequence('people', 'id'), COALESCE(MAX(id), 1)) FROM people;")
    print("People migrated successfully!")

    # 2. Migrate Work
    for w in work:
        cur.execute(
            """INSERT INTO work (
                id, person_id, title, description, category, agreed_amount,
                status, priority, start_date, deadline, completed_date, notes,
                service_category, service_name, portal_name, token_no, ack_no,
                portal_cost, panchayat_share, vce_commission, is_archived,
                created_at, updated_at
            ) VALUES (
                %(id)s, %(person_id)s, %(title)s, %(description)s, %(category)s, %(agreed_amount)s,
                %(status)s, %(priority)s, %(start_date)s, %(deadline)s, %(completed_date)s, %(notes)s,
                %(service_category)s, %(service_name)s, %(portal_name)s, %(token_no)s, %(ack_no)s,
                %(portal_cost)s, %(panchayat_share)s, %(vce_commission)s, 0,
                %(created_at)s, %(updated_at)s
            ) ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                agreed_amount = EXCLUDED.agreed_amount,
                status = EXCLUDED.status;""",
            w
        )
    if work:
        cur.execute("SELECT setval(pg_get_serial_sequence('work', 'id'), COALESCE(MAX(id), 1)) FROM work;")
    print("Work records migrated successfully!")

    # 3. Migrate Payments
    for pm in payments:
        cur.execute(
            """INSERT INTO payments (
                id, person_id, work_id, amount, payment_method, payment_status,
                transaction_reference, payment_date, payment_time, notes,
                created_at, updated_at
            ) VALUES (
                %(id)s, %(person_id)s, %(work_id)s, %(amount)s, %(payment_method)s, %(payment_status)s,
                %(transaction_reference)s, %(payment_date)s, %(payment_time)s, %(notes)s,
                %(created_at)s, %(updated_at)s
            ) ON CONFLICT (id) DO UPDATE SET
                amount = EXCLUDED.amount,
                payment_method = EXCLUDED.payment_method;""",
            pm
        )
    if payments:
        cur.execute("SELECT setval(pg_get_serial_sequence('payments', 'id'), COALESCE(MAX(id), 1)) FROM payments;")
    print("Payments migrated successfully!")

    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
