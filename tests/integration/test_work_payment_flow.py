"""End-to-End V1 Acceptance Criteria Integration Test Suite.
Verifies all 17 steps in Section 15 of REQUIREMENTS.md.
"""
from fastapi.testclient import TestClient


def test_v1_full_acceptance_criteria_flow(client: TestClient):
    # Step 1: Add a person named "Example Client"
    res = client.post("/api/people", json={
        "name": "Example Client",
        "phone": "+91 98765 00000",
        "company": "Acme Ventures"
    })
    assert res.status_code == 201, res.text
    person = res.json()
    person_id = person["id"]
    assert person["name"] == "Example Client"

    # Step 2 & 3: Add work from that person and set agreed amount to ₹10,000 (1000000 paise)
    res = client.post("/api/work", json={
        "person_id": person_id,
        "title": "Corporate Web Development",
        "agreed_amount": 1000000,
        "category": "Development",
        "status": "In Progress",
        "deadline": "2026-09-30"
    })
    assert res.status_code == 201, res.text
    work = res.json()
    work_id = work["id"]
    assert work["agreed_amount"] == 1000000
    assert work["pending_amount"] == 1000000
    assert work["received_amount"] == 0

    # Step 4: Record ₹3,000 received online (300000 paise)
    res = client.post("/api/payments", json={
        "person_id": person_id,
        "work_id": work_id,
        "amount": 300000,
        "payment_method": "Online",
        "payment_date": "2026-09-20",
        "payment_time": "10:00:00",
        "transaction_reference": "UPI123456"
    })
    assert res.status_code == 201, res.text

    # Step 5: See ₹7,000 pending (700000 paise)
    res = client.get(f"/api/work/{work_id}")
    assert res.status_code == 200
    work_check1 = res.json()
    assert work_check1["received_amount"] == 300000
    assert work_check1["pending_amount"] == 700000

    # Step 6: Record ₹2,000 received in cash later (200000 paise)
    res = client.post("/api/payments", json={
        "person_id": person_id,
        "work_id": work_id,
        "amount": 200000,
        "payment_method": "Cash",
        "payment_date": "2026-09-20",
        "payment_time": "14:00:00"
    })
    assert res.status_code == 201, res.text

    # Step 7: See ₹5,000 remaining (500000 paise)
    res = client.get(f"/api/work/{work_id}")
    assert res.status_code == 200
    work_check2 = res.json()
    assert work_check2["received_amount"] == 500000
    assert work_check2["pending_amount"] == 500000

    # Step 8: Record a ₹500 work-related expense (50000 paise)
    res = client.post("/api/expenses", json={
        "work_id": work_id,
        "title": "Hosting & Server Setup",
        "amount": 50000,
        "payment_method": "Online",
        "expense_date": "2026-09-20",
        "expense_time": "15:00:00",
        "vendor": "AWS"
    })
    assert res.status_code == 201, res.text

    # Step 9, 10, 11: Check Dashboard:
    # - Received revenue = ₹5,000 (500000 paise)
    # - Expense in selected period = ₹500 (50000 paise)
    # - Profit = received revenue - expenses = ₹4,500 (450000 paise)
    # - Total pending / udhar = ₹5,000 (500000 paise)
    res = client.get("/api/dashboard?preset=all")
    assert res.status_code == 200
    dash = res.json()
    metrics = dash["metrics"]
    assert metrics["period_revenue"] == 500000, f"Expected 500000, got {metrics['period_revenue']}"
    assert metrics["period_expenses"] == 50000, f"Expected 50000, got {metrics['period_expenses']}"
    assert metrics["period_profit"] == 450000, f"Expected 450000, got {metrics['period_profit']}"
    assert metrics["total_pending_udhar"] == 500000, f"Expected 500000, got {metrics['total_pending_udhar']}"

    # Step 12: Search the ₹3,000 payment (amount in paise = 300000)
    res = client.get("/api/search?min_amount=300000&max_amount=300000&types=payment")
    assert res.status_code == 200
    search_pay = res.json()
    assert len(search_pay["results"]["payments"]) == 1
    assert search_pay["results"]["payments"][0]["amount"] == 300000

    # Step 13: Filter all cash payments
    res = client.get("/api/payments?payment_method=Cash")
    assert res.status_code == 200
    cash_payments = res.json()
    assert len(cash_payments) == 1
    assert cash_payments[0]["amount"] == 200000
    assert cash_payments[0]["payment_method"] == "Cash"

    # Step 14: Filter all records for the example client
    res = client.get(f"/api/people/{person_id}/detail")
    assert res.status_code == 200
    client_detail = res.json()
    assert len(client_detail["work_history"]) == 1
    assert len(client_detail["payment_history"]) == 2
    assert client_detail["total_agreed"] == 1000000
    assert client_detail["total_received"] == 500000
    assert client_detail["total_pending"] == 500000

    # Step 15: Open the work and see its payment timeline
    res = client.get(f"/api/work/{work_id}/timeline")
    assert res.status_code == 200
    timeline = res.json()
    assert len(timeline["payments"]) == 2
    assert len(timeline["expenses"]) == 1
    assert len(timeline["activities"]) >= 3

    # Step 16: Search by date and amount
    res = client.get("/api/search?date_from=2026-09-01&date_to=2026-09-30&min_amount=100000")
    assert res.status_code == 200
    multi_search = res.json()
    assert multi_search["total_matches"] >= 2

    # Step 17: Export the filtered records (CSV, Excel, PDF)
    res_csv = client.get("/api/reports/export?type=revenue&format=csv&preset=all")
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]

    res_excel = client.get("/api/reports/export?type=revenue&format=excel&preset=all")
    assert res_excel.status_code == 200
    assert "spreadsheetml" in res_excel.headers["content-type"]

    res_pdf = client.get("/api/reports/export?type=revenue&format=pdf&preset=all")
    assert res_pdf.status_code == 200
    assert "application/pdf" in res_pdf.headers["content-type"]
