"""Accounting integrity, dual-entry principles, and statutory compliance test suite."""
import pytest
from datetime import date
from fastapi.testclient import TestClient
from backend.utils.dates import get_date_range, get_current_fy_label


def test_agent_vs_principal_and_net_commission(client: TestClient):
    """Verify that dashboard distinguishes gross collections from net commission revenue."""
    # 1. Create a person
    p_res = client.post("/api/people", json={"name": "Rameshbhai Patel", "phone": "9825099999", "village": "Chikhodra"})
    assert p_res.status_code == 201
    person_id = p_res.json()["id"]

    # 2. Create AnyRoR application (Fee ₹25 = 2500 paise, Portal Cost ₹5 = 500, GP Share ₹5 = 500, VCE Commission ₹15 = 1500)
    w_res = client.post("/api/work", json={
        "person_id": person_id,
        "title": "7/12 RoR Extract Copy",
        "category": "AnyRoR Land Records (7/12 & 8-A)",
        "service_category": "AnyRoR Land Records (7/12 & 8-A)",
        "service_name": "7/12 & 8-A Land Record Copy",
        "portal_name": "AnyRoR",
        "agreed_amount": 2500,
        "portal_cost": 500,
        "panchayat_share": 500,
        "vce_commission": 1500,
        "status": "Completed"
    })
    assert w_res.status_code == 201
    work_id = w_res.json()["id"]

    # 3. Citizen pays ₹25 in cash
    pay_res = client.post("/api/payments", json={
        "person_id": person_id,
        "work_id": work_id,
        "amount": 2500,
        "payment_method": "Cash",
        "payment_status": "received",
        "payment_date": date.today().strftime("%Y-%m-%d"),
        "payment_time": "10:30:00"
    })
    assert pay_res.status_code == 201

    # 4. Check dashboard metrics
    dash_res = client.get("/api/dashboard?preset=today")
    assert dash_res.status_code == 200
    metrics = dash_res.json()["metrics"]

    # Gross citizen collection is ₹25 (2500 paise)
    assert metrics["gross_citizen_collections"] >= 2500
    # Net commission revenue earned by VCE is ₹15 (1500 paise)
    assert metrics["net_commission_revenue"] >= 1500
    # Panchayat share payable tracked
    assert metrics["panchayat_share_payable"] >= 500


def test_portal_wallet_auto_deduction(client: TestClient):
    """Verify that completing a service with portal_cost auto-debits the corresponding portal wallet."""
    # 1. Check initial AnyRoR wallet balance
    wallets_res = client.get("/api/vce/wallets")
    wallets = wallets_res.json()
    anyror = next((w for w in wallets if "AnyRoR" in w["portal_name"]), wallets[0])
    initial_balance = anyror["current_balance"]

    # 2. Create person and complete work with AnyRoR portal cost ₹5 (500 paise)
    p_res = client.post("/api/people", json={"name": "Kiritbhai Vankar", "phone": "9898011111"})
    person_id = p_res.json()["id"]

    w_res = client.post("/api/work", json={
        "person_id": person_id,
        "title": "VF-6 Mutation Entry",
        "category": "AnyRoR Land Records (7/12 & 8-A)",
        "portal_name": anyror["portal_name"],
        "agreed_amount": 3000,
        "portal_cost": 500,
        "panchayat_share": 500,
        "vce_commission": 2000,
        "status": "Completed"
    })
    assert w_res.status_code == 201

    # 3. Check wallet balance decremented
    wallets_after = client.get("/api/vce/wallets").json()
    anyror_after = next(w for w in wallets_after if w["id"] == anyror["id"])
    assert anyror_after["current_balance"] == initial_balance - 500


def test_wallet_topup_and_rojmel_cash_integration(client: TestClient):
    """Verify that cash wallet top-ups are deducted from closing cash in Rojmel."""
    wallets = client.get("/api/vce/wallets").json()
    wallet_id = wallets[0]["id"]
    today_str = date.today().strftime("%Y-%m-%d")

    # Top-up wallet with ₹200 (20000 paise) via Cash
    topup_res = client.post(f"/api/vce/wallets/{wallet_id}/topup", json={
        "amount": 20000,
        "payment_method": "Cash",
        "reference_no": "DRAWER-RECHARGE-01",
        "notes": "Cash from center drawer"
    })
    assert topup_res.status_code == 200

    # Inspect Rojmel
    rojmel_res = client.get(f"/api/vce/rojmel?target_date={today_str}")
    assert rojmel_res.status_code == 200
    rojmel = rojmel_res.json()
    assert rojmel["today_wallet_recharges_cash"] >= 20000

    # Ensure a Javak entry exists for wallet top-up
    wallet_entries = [e for e in rojmel["entries"] if e["category"] == "Portal Float Recharge"]
    assert len(wallet_entries) >= 1
    assert wallet_entries[0]["amount"] == 20000


def test_panchayat_remittance_workflow(client: TestClient):
    """Verify recording remittance to Gram Panchayat decrements payable liability and appears in Rojmel."""
    today_str = date.today().strftime("%Y-%m-%d")

    remit_payload = {
        "amount": 10000,  # ₹100.00
        "payment_method": "Cash",
        "remittance_date": today_str,
        "talati_receipt_no": "TALATI-RCPT-2026-088",
        "period_from": "2026-09-01",
        "period_to": today_str,
        "notes": "Settled royalty for first half of September"
    }
    remit_res = client.post("/api/vce/panchayat-remittances", json=remit_payload)
    assert remit_res.status_code == 201
    created_remit = remit_res.json()
    assert created_remit["talati_receipt_no"] == "TALATI-RCPT-2026-088"

    # List remittances
    list_res = client.get("/api/vce/panchayat-remittances")
    assert list_res.status_code == 200
    assert any(r["id"] == created_remit["id"] for r in list_res.json())

    # Check Rojmel has remittance in Javak
    rojmel = client.get(f"/api/vce/rojmel?target_date={today_str}").json()
    assert rojmel["today_panchayat_remitted"] >= 10000
    remit_entries = [e for e in rojmel["entries"] if e["category"] == "Panchayat Royalty Remittance"]
    assert len(remit_entries) >= 1


def test_rojmel_deficit_alert_no_clamping(client: TestClient):
    """Verify that if outflows exceed inflows, closing_cash is accurately negative and is_cash_deficit is True."""
    future_date = "2099-01-01"

    # Record a standalone large expense of ₹500 (50000 paise) in cash with zero inflows
    exp_res = client.post("/api/expenses", json={
        "title": "Emergency Toner Drum Replacement",
        "amount": 50000,
        "payment_method": "Cash",
        "expense_date": future_date,
        "expense_time": "14:00:00"
    })
    assert exp_res.status_code == 201

    rojmel_res = client.get(f"/api/vce/rojmel?target_date={future_date}")
    assert rojmel_res.status_code == 200
    rojmel = rojmel_res.json()

    # Verify that closing cash reflects the deficit without being clamped to 0
    assert rojmel["closing_cash"] < 0
    assert rojmel["is_cash_deficit"] is True


def test_rojmel_day_closing_and_denomination(client: TestClient):
    """Verify closing and locking a day with physical cash denominations and variance calculation."""
    close_date = "2026-09-18"
    summary = client.get(f"/api/vce/rojmel?target_date={close_date}").json()
    system_cash = summary["closing_cash"]

    # Physical cash count: let's say ₹1,000 (100000 paise)
    payload = {
        "close_date": close_date,
        "physical_cash_total": 100000,
        "denominations_json": '{"500": 2}',
        "closed_by": "Amit Patel (VCE)",
        "notes": "Verified against physical cash drawer"
    }
    close_res = client.post("/api/vce/rojmel/close-day", json=payload)
    assert close_res.status_code == 200
    res_data = close_res.json()
    assert res_data["close_date"] == close_date
    assert res_data["physical_cash_total"] == 100000
    assert res_data["cash_variance"] == 100000 - system_cash
    assert res_data["is_locked"] is True

    # Retrieve day close
    get_res = client.get(f"/api/vce/rojmel/close-day/{close_date}")
    assert get_res.status_code == 200
    assert get_res.json()["is_locked"] is True


def test_indian_financial_year_presets():
    """Verify Indian Financial Year presets (01-Apr to 31-Mar) and quarter calculations."""
    start_fy, end_fy = get_date_range("this_fy")
    assert start_fy.endswith("-04-01")
    assert end_fy.endswith("-03-31")

    # Check quarters
    q1_s, q1_e = get_date_range("q1_fy")
    assert q1_s.endswith("-04-01") and q1_e.endswith("-06-30")

    q2_s, q2_e = get_date_range("q2_fy")
    assert q2_s.endswith("-07-01") and q2_e.endswith("-09-30")

    q3_s, q3_e = get_date_range("q3_fy")
    assert q3_s.endswith("-10-01") and q3_e.endswith("-12-31")

    q4_s, q4_e = get_date_range("q4_fy")
    assert q4_s.endswith("-01-01") and q4_e.endswith("-03-31")

    label = get_current_fy_label()
    assert label.startswith("FY 20")


def test_dept_orders_tds_and_disallowed_deduction(client: TestClient):
    """Verify that recording TDS and disallowed claim amounts accurately updates pending claim."""
    order_payload = {
        "dept_name": "Revenue Department",
        "scheme_name": "Digital Land Survey Drive 2026",
        "target_units": 100,
        "completed_units": 100,
        "unit_rate": 2000,  # Total Claim: ₹2,000 = 200000 paise
        "claim_status": "Partially Disbursed"
    }
    create_res = client.post("/api/vce/dept-orders", json=order_payload)
    assert create_res.status_code == 201
    order_id = create_res.json()["id"]

    # Update: Received ₹1,900, with ₹40 TDS (2%) and ₹60 disallowed
    update_res = client.put(f"/api/vce/dept-orders/{order_id}", json={
        "amount_received": 190000,
        "tds_deducted": 4000,
        "disallowed_amount": 6000
    })
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["total_claim_amount"] == 200000
    assert data["amount_received"] == 190000
    assert data["tds_deducted"] == 4000
    assert data["disallowed_amount"] == 6000
    # Pending should be 0 because: 200000 - 190000 - 4000 - 6000 = 0
    assert data["pending_claim_amount"] == 0


def test_balance_sheet_and_accrual_pnl(client: TestClient):
    """Verify Balance Sheet and Accrual P&L report generation."""
    # 1. Balance Sheet
    bs_res = client.get("/api/reports?report_type=balance_sheet&preset=all")
    assert bs_res.status_code == 200
    bs = bs_res.json()
    assert bs["report_type"] == "balance_sheet"
    assert "total_assets" in bs
    assert "total_liabilities" in bs
    assert "equity" in bs
    # Balance Sheet fundamental equation: Assets = Liabilities + Equity
    assert bs["total_assets"] == bs["total_liabilities"] + bs["equity"]

    # 2. Accrual P&L
    pnl_res = client.get("/api/reports?report_type=accrual_pnl&preset=all")
    assert pnl_res.status_code == 200
    pnl = pnl_res.json()
    assert pnl["report_type"] == "accrual_pnl"
    assert "total_revenue" in pnl
    assert "total_expenses" in pnl
    assert "net_profit" in pnl
    assert "presumptive_income_44ada" in pnl
    # Verify 50% presumptive income calculation
    assert pnl["presumptive_income_44ada"] == int(pnl["total_revenue"] * 0.5)
