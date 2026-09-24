"""Tests for VCE Pali specific features and e-Gram workflows."""
from fastapi.testclient import TestClient


def test_vce_services_catalog(client: TestClient):
    """Test retrieving the official Gujarat e-Gram service catalog."""
    res = client.get("/api/vce/services-catalog")
    assert res.status_code == 200
    catalog = res.json()
    assert len(catalog) >= 10
    
    # Check for AnyRoR 7/12 service
    anyror = next((item for item in catalog if "anyror-7-12" in item["id"]), None)
    assert anyror is not None
    assert anyror["portal"] == "AnyRoR"
    assert anyror["standard_fee"] == 2500  # ₹25.00
    assert anyror["portal_cost"] == 500   # ₹5.00
    assert anyror["vce_commission"] == 1500 # ₹15.00

    # Check for Digital Gujarat Income Certificate
    income = next((item for item in catalog if item["id"] == "dg-income"), None)
    assert income is not None
    assert income["portal"] == "Digital Gujarat"
    assert income["standard_fee"] == 5000  # ₹50.00
    assert income["portal_cost"] == 2000   # ₹20.00


def test_panchayat_profile_lifecycle(client: TestClient):
    """Test fetching and updating Gram Panchayat profile."""
    # 1. Fetch default profile
    res = client.get("/api/vce/profile")
    assert res.status_code == 200
    profile = res.json()
    assert profile["id"] == 1
    assert profile["district"] == ""

    # 2. Update profile
    update_data = {
        "district": "Mehsana",
        "taluka": "Kadi",
        "gram_panchayat": "Nandasan Gram Panchayat",
        "center_id": "EGRAM-GJ-0899",
        "vce_name": "Hareshbhai Patel",
        "vce_phone": "9898012345",
        "talati_name": "D. M. Prajapati"
    }
    put_res = client.put("/api/vce/profile", json=update_data)
    assert put_res.status_code == 200
    updated = put_res.json()
    assert updated["district"] == "Mehsana"
    assert updated["gram_panchayat"] == "Nandasan Gram Panchayat"
    assert updated["vce_name"] == "Hareshbhai Patel"


def test_portal_wallets_and_topup(client: TestClient):
    """Test listing portal wallets, detecting low balances, and top-up recharge."""
    # 1. List wallets
    res = client.get("/api/vce/wallets")
    assert res.status_code == 200
    wallets = res.json()
    assert len(wallets) >= 3
    
    dg_wallet = next((w for w in wallets if "Digital Gujarat" in w["portal_name"]), wallets[0])
    wallet_id = dg_wallet["id"]
    initial_balance = dg_wallet["current_balance"]

    # 2. Top up wallet with ₹1,000 (100000 paise)
    topup_payload = {
        "amount": 100000,
        "reference_no": "UPI-GJ-98213712",
        "payment_method": "UPI",
        "notes": "Bank to Digital Gujarat wallet top-up"
    }
    topup_res = client.post(f"/api/vce/wallets/{wallet_id}/topup", json=topup_payload)
    assert topup_res.status_code == 200
    updated_wallet = topup_res.json()
    assert updated_wallet["current_balance"] == initial_balance + 100000
    assert updated_wallet["is_low_balance"] is False

    # 3. Check transaction log
    tx_res = client.get(f"/api/vce/wallets/{wallet_id}/transactions")
    assert tx_res.status_code == 200
    txs = tx_res.json()
    assert len(txs) >= 1
    assert txs[0]["amount"] == 100000
    assert txs[0]["reference_no"] == "UPI-GJ-98213712"


def test_dept_work_orders_and_mandated_rate(client: TestClient):
    """Test state govt task orders with mandated minimum ₹20/unit rate."""
    # 1. Create a survey order (e.g. Health Dept Ayushman verification drive)
    order_payload = {
        "dept_name": "Health Department",
        "scheme_name": "Ayushman Bharat PM-JAY e-KYC Drive 2026",
        "order_ref": "HLTH/EGRAM/2026/042",
        "target_units": 500,
        "completed_units": 350,
        "unit_rate": 2000,  # Mandated ₹20.00
        "claim_status": "In Progress",
        "order_date": "2026-09-01",
        "notes": "Door-to-door e-KYC in Ward 1 to 4"
    }
    res = client.post("/api/vce/dept-orders", json=order_payload)
    assert res.status_code == 201
    created = res.json()
    order_id = created["id"]
    # Total claim = 350 * 2000 = 700000 paise (₹7,000)
    assert created["total_claim_amount"] == 700000
    assert created["pending_claim_amount"] == 700000
    assert created["amount_received"] == 0

    # 2. Update order: Complete 500 units and record partial disbursement of ₹5,000 (500000 paise)
    update_payload = {
        "completed_units": 500,
        "amount_received": 500000,
        "claim_status": "Partial Disbursed",
        "submission_date": "2026-09-10",
        "disbursement_date": "2026-09-18"
    }
    put_res = client.put(f"/api/vce/dept-orders/{order_id}", json=update_payload)
    assert put_res.status_code == 200
    updated = put_res.json()
    assert updated["completed_units"] == 500
    assert updated["total_claim_amount"] == 1000000  # 500 * 20 = ₹10,000 (1000000 paise)
    assert updated["amount_received"] == 500000
    assert updated["pending_claim_amount"] == 500000 # ₹5,000 pending


def test_egram_citizen_application_and_rojmel(client: TestClient):
    """Test full e-Gram workflow: citizen creation -> 7/12 application -> cash payment -> daily rojmel tally."""
    # 1. Register a village citizen (farmer)
    citizen_res = client.post("/api/people", json={
        "name": "Rameshbhai Somabhai Patel",
        "phone": "9825112233",
        "village": "Mota Faliya",
        "khata_no": "142",
        "citizen_type": "Farmer",
        "notes": "Farmer with 5 vigha land"
    })
    assert citizen_res.status_code == 201
    citizen = citizen_res.json()
    person_id = citizen["id"]
    assert citizen["village"] == "Mota Faliya"
    assert citizen["khata_no"] == "142"

    # 2. Create AnyRoR 7/12 application
    app_res = client.post("/api/work", json={
        "person_id": person_id,
        "title": "7/12 & 8-A Record of Rights",
        "service_category": "AnyRoR Land Records (7/12 & 8-A)",
        "service_name": "7/12 & 8-A Extract",
        "portal_name": "AnyRoR",
        "agreed_amount": 2500,       # ₹25.00
        "portal_cost": 500,         # ₹5.00
        "panchayat_share": 500,     # ₹5.00
        "vce_commission": 1500,     # ₹15.00
        "status": "Ready / Printed",
        "priority": "Medium",
        "start_date": "2026-09-20",
        "deadline": "2026-09-20"
    })
    assert app_res.status_code == 201
    application = app_res.json()
    work_id = application["id"]
    assert application["token_no"].startswith("TK-")
    assert application["portal_name"] == "AnyRoR"

    # 3. Pay fee in cash
    pay_res = client.post("/api/payments", json={
        "person_id": person_id,
        "work_id": work_id,
        "amount": 2500,
        "payment_method": "Cash",
        "payment_date": "2026-09-20",
        "payment_time": "11:30:00",
        "notes": "Cash collected from citizen"
    })
    assert pay_res.status_code == 201

    # 4. Record paper expense (outflow)
    exp_res = client.post("/api/expenses", json={
        "title": "A4 JK Copier Paper Ream",
        "amount": 32000, # ₹320.00
        "payment_method": "Cash",
        "expense_date": "2026-09-20",
        "expense_time": "12:00:00",
        "vendor": "Ambica Stationery"
    })
    assert exp_res.status_code == 201

    # 5. Fetch Daily Rojmel
    rojmel_res = client.get("/api/vce/rojmel?target_date=2026-09-20")
    assert rojmel_res.status_code == 200
    rojmel = rojmel_res.json()
    assert rojmel["date"] == "2026-09-20"
    assert rojmel["today_citizen_cash"] == 2500
    assert rojmel["today_expenses_cash"] == 32000
    assert len(rojmel["entries"]) >= 2
