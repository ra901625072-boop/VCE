"""API endpoints for VCE Pali e-Gram operations, wallets, dept claims, and Rojmel."""
import sqlite3
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from backend.database.connection import get_db
from backend.database.queries import log_activity
from backend.utils.dates import now_utc_iso, today_date_str
from backend.schemas.vce import (
    PanchayatProfileResponse,
    PanchayatProfileUpdate,
    PortalWalletResponse,
    PortalWalletCreate,
    PortalWalletUpdate,
    WalletTopupRequest,
    WalletTransactionResponse,
    DeptWorkOrderCreate,
    DeptWorkOrderUpdate,
    DeptWorkOrderResponse,
    PanchayatRemittanceCreate,
    PanchayatRemittanceResponse,
    RojmelDayCloseCreate,
    RojmelDayCloseResponse,
    ServiceCatalogItem,
    RojmelSummary,
    RojmelDayRow
)

router = APIRouter(prefix="/vce", tags=["VCE Pali Operations"])

# Standard Gujarat e-Gram Service Catalog
GUJARAT_SERVICES_CATALOG = [
    {
        "id": "anyror-7-12",
        "category": "AnyRoR Land Records (7/12 & 8-A)",
        "name": "7/12 & 8-A Land Record Copy",
        "name_gu": "7/12 & 8-A RoR Land Extract",
        "portal": "AnyRoR",
        "standard_fee": 2500,       # ₹25.00
        "portal_cost": 500,         # ₹5.00 deducted from AnyRoR
        "panchayat_share": 500,     # ₹5.00 to Gram Panchayat
        "vce_commission": 1500,     # ₹15.00 VCE net earning
        "description": "Digitally signed Record of Rights (RoR) 7/12 & 8A extracts from AnyRoR portal"
    },
    {
        "id": "anyror-vf6",
        "category": "AnyRoR Land Records (7/12 & 8-A)",
        "name": "VF-6 Mutation Entry (Hak Patrak)",
        "name_gu": "Village Form No. 6 Mutation Copy",
        "portal": "AnyRoR",
        "standard_fee": 3000,
        "portal_cost": 500,
        "panchayat_share": 500,
        "vce_commission": 2000,
        "description": "Mutation entry and land rights change record printout"
    },
    {
        "id": "dg-income",
        "category": "Digital Gujarat Certificates",
        "name": "Income Certificate",
        "name_gu": "Income Certificate (Digital Gujarat)",
        "portal": "Digital Gujarat",
        "standard_fee": 5000,       # ₹50.00
        "portal_cost": 2000,        # ₹20.00 portal deduction
        "panchayat_share": 500,
        "vce_commission": 2500,
        "description": "Online application with Talati verification and digital certificate printout"
    },
    {
        "id": "dg-caste",
        "category": "Digital Gujarat Certificates",
        "name": "Caste Certificate (SC/ST/SEBC/EWS)",
        "name_gu": "Caste Certificate Issuance",
        "portal": "Digital Gujarat",
        "standard_fee": 5000,
        "portal_cost": 2000,
        "panchayat_share": 500,
        "vce_commission": 2500,
        "description": "Social justice department caste certificate issuance"
    },
    {
        "id": "dg-ncl",
        "category": "Digital Gujarat Certificates",
        "name": "Non-Creamy Layer (NCL) Certificate",
        "name_gu": "SEBC NCL Appendix-4 Certificate",
        "portal": "Digital Gujarat",
        "standard_fee": 5000,
        "portal_cost": 2000,
        "panchayat_share": 500,
        "vce_commission": 2500,
        "description": "OBC/SEBC Non-Creamy Layer certificate for employment and education"
    },
    {
        "id": "pension-widow",
        "category": "Digital Gujarat Certificates",
        "name": "Widow Pension Scheme (Ganga Swarupa)",
        "name_gu": "Widow Pension Scheme Application",
        "portal": "Digital Gujarat",
        "standard_fee": 7000,
        "portal_cost": 0,
        "panchayat_share": 1000,
        "vce_commission": 6000,
        "description": "Monthly pension support scheme application for widows"
    },
    {
        "id": "pension-vrudh",
        "category": "Digital Gujarat Certificates",
        "name": "Old Age Pension Scheme (Niradhar Vrudh)",
        "name_gu": "Elderly Pension Assistance Application",
        "portal": "Digital Gujarat",
        "standard_fee": 7000,
        "portal_cost": 0,
        "panchayat_share": 1000,
        "vce_commission": 6000,
        "description": "Old-age financial assistance scheme application for elderly citizens"
    },
    {
        "id": "ikhedut-subsidy",
        "category": "Farmer & iKhedut / PM-Kisan",
        "name": "iKhedut Scheme Subsidy Application",
        "name_gu": "iKhedut Subsidy (Fencing, Pipeline, Drip)",
        "portal": "iKhedut",
        "standard_fee": 6000,
        "portal_cost": 0,
        "panchayat_share": 1000,
        "vce_commission": 5000,
        "description": "Subsidy application for tractors, solar pumps, fencing, pipeline, and machinery"
    },
    {
        "id": "ikhedut-msp",
        "category": "Farmer & iKhedut / PM-Kisan",
        "name": "MSP Crop Procurement Registration",
        "name_gu": "MSP Farmer Crop Registration",
        "portal": "e-Samridhi",
        "standard_fee": 5000,
        "portal_cost": 0,
        "panchayat_share": 1000,
        "vce_commission": 4000,
        "description": "Government minimum support price procurement farmer registration"
    },
    {
        "id": "pm-kisan-ekyc",
        "category": "Farmer & iKhedut / PM-Kisan",
        "name": "PM-Kisan Samman Nidhi e-KYC",
        "name_gu": "PM-Kisan Biometric & OTP e-KYC",
        "portal": "PM-Kisan",
        "standard_fee": 3000,
        "portal_cost": 0,
        "panchayat_share": 0,
        "vce_commission": 3000,
        "description": "Biometric fingerprint / OTP e-KYC verification for ₹6,000 yearly farmer aid"
    },
    {
        "id": "ration-new",
        "category": "Civil Supplies & Ration Card",
        "name": "New Ration Card Application",
        "name_gu": "New NFSA Ration Card Online Form",
        "portal": "Digital Gujarat",
        "standard_fee": 7000,
        "portal_cost": 2000,
        "panchayat_share": 1000,
        "vce_commission": 4000,
        "description": "Application for new barcoded/NFSA ration card"
    },
    {
        "id": "ration-edit",
        "category": "Civil Supplies & Ration Card",
        "name": "Ration Card Member Addition / Deletion",
        "name_gu": "Ration Card Member Modification",
        "portal": "Digital Gujarat",
        "standard_fee": 5000,
        "portal_cost": 2000,
        "panchayat_share": 500,
        "vce_commission": 2500,
        "description": "Add new born or spouse, or remove deceased/transferred member"
    },
    {
        "id": "ration-split",
        "category": "Civil Supplies & Ration Card",
        "name": "Ration Card Separation / Split",
        "name_gu": "Ration Card Division Application",
        "portal": "Digital Gujarat",
        "standard_fee": 7000,
        "portal_cost": 2000,
        "panchayat_share": 1000,
        "vce_commission": 4000,
        "description": "Splitting joint ration card into independent household card"
    },
    {
        "id": "panchayat-pedhinama",
        "category": "Panchayat & Civic Services",
        "name": "Pedhinama / Family Tree Affidavit",
        "name_gu": "Genealogical Heirship Affidavit & Panchnama",
        "portal": "Panchayat",
        "standard_fee": 10000,
        "portal_cost": 0,
        "panchayat_share": 2000,
        "vce_commission": 8000,
        "description": "Affidavit, genealogical table verification, and Talati sign workflow"
    },
    {
        "id": "panchayat-birth-death",
        "category": "Panchayat & Civic Services",
        "name": "Birth / Death Certificate Copy",
        "name_gu": "Civil Registration Certificate Copy",
        "portal": "e-Gram",
        "standard_fee": 3000,
        "portal_cost": 500,
        "panchayat_share": 1000,
        "vce_commission": 1500,
        "description": "Official civil registration certified certificate copy"
    },
    {
        "id": "health-ayushman",
        "category": "Identity & Ayushman Card",
        "name": "Ayushman Bharat PM-JAY Card (₹10 Lakh Cover)",
        "name_gu": "Ayushman Card Biometric e-KYC & PVC Print",
        "portal": "BIS Portal",
        "standard_fee": 4000,
        "portal_cost": 0,
        "panchayat_share": 500,
        "vce_commission": 3500,
        "description": "Biometric verification and PVC plastic card delivery"
    },
    {
        "id": "election-voter",
        "category": "Identity & Ayushman Card",
        "name": "Voter ID Form 6/7/8 Registration",
        "name_gu": "Voter Identity Card Application & Correction",
        "portal": "Voter Portal",
        "standard_fee": 3000,
        "portal_cost": 0,
        "panchayat_share": 500,
        "vce_commission": 2500,
        "description": "New voter registration and correction submission"
    },
    {
        "id": "utility-electricity",
        "category": "Utility Bills & CSC Services",
        "name": "Electricity Bill Payment (Discom)",
        "name_gu": "Power Bill Collection & Receipt",
        "portal": "CSC / Discom",
        "standard_fee": 1000,       # ₹10.00 service fee
        "portal_cost": 0,
        "panchayat_share": 0,
        "vce_commission": 1000,
        "description": "Online power bill collection with printed acknowledgment receipt"
    },
    {
        "id": "govt-survey-unit",
        "category": "State Dept Work Orders (₹20/Unit)",
        "name": "State Dept Survey / Data Entry (₹20/Unit)",
        "name_gu": "Government Survey Task (₹20/Unit Rate)",
        "portal": "Dept Portal",
        "standard_fee": 2000,       # Mandated ₹20.00 per unit
        "portal_cost": 0,
        "panchayat_share": 0,
        "vce_commission": 2000,
        "description": "Chief Minister resolution mandated minimum ₹20/unit state department assignment"
    }
]


# ---------------------------------------------------------------------------
# Services Catalog
# ---------------------------------------------------------------------------
@router.get("/services-catalog", response_model=List[ServiceCatalogItem])
def get_services_catalog():
    """Returns the official pre-configured Gujarat e-Gram service catalog."""
    return GUJARAT_SERVICES_CATALOG


# ---------------------------------------------------------------------------
# Gram Panchayat Center Profile
# ---------------------------------------------------------------------------
@router.get("/profile", response_model=PanchayatProfileResponse)
def get_panchayat_profile():
    """Fetches the current Gram Panchayat center details."""
    with get_db() as conn:
        row = conn.execute("SELECT * FROM panchayat_profile WHERE id = 1").fetchone()
        if not row:
            now = now_utc_iso()
            conn.execute(
                """INSERT INTO panchayat_profile 
                   (id, district, taluka, gram_panchayat, center_id, vce_name, vce_phone, talati_name, updated_at)
                   VALUES (1, '', '', '', '', '', '', '', ?)""",
                (now,)
            )
            row = conn.execute("SELECT * FROM panchayat_profile WHERE id = 1").fetchone()
        return dict(row)


@router.put("/profile", response_model=PanchayatProfileResponse)
def update_panchayat_profile(payload: PanchayatProfileUpdate):
    """Updates the Gram Panchayat center details."""
    now = now_utc_iso()
    with get_db() as conn:
        row = conn.execute("SELECT * FROM panchayat_profile WHERE id = 1").fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Panchayat profile not found")

        updates = []
        params = []
        for field, value in payload.model_dump(exclude_unset=True).items():
            updates.append(f"{field} = ?")
            params.append(value)

        if updates:
            updates.append("updated_at = ?")
            params.append(now)
            params.append(1)
            conn.execute(f"UPDATE panchayat_profile SET {', '.join(updates)} WHERE id = ?", params)
            log_activity(conn, "panchayat_profile", 1, "updated", "Updated Gram Panchayat center profile")

        updated_row = conn.execute("SELECT * FROM panchayat_profile WHERE id = 1").fetchone()
        return dict(updated_row)


# ---------------------------------------------------------------------------
# Portal Wallets
# ---------------------------------------------------------------------------
@router.get("/wallets", response_model=List[PortalWalletResponse])
def get_portal_wallets():
    """Lists all portal wallets with balance and low balance warnings."""
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM portal_wallets ORDER BY id ASC").fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["is_low_balance"] = d["current_balance"] <= d["min_alert_balance"]
            result.append(d)
        return result


@router.post("/wallets", response_model=PortalWalletResponse, status_code=status.HTTP_201_CREATED)
def create_portal_wallet(payload: PortalWalletCreate):
    """Creates a new portal wallet."""
    now = now_utc_iso()
    with get_db() as conn:
        try:
            cur = conn.execute(
                """INSERT INTO portal_wallets (portal_name, current_balance, min_alert_balance, updated_at)
                   VALUES (?, ?, ?, ?)""",
                (payload.portal_name, payload.current_balance, payload.min_alert_balance, now)
            )
            wallet_id = cur.lastrowid
            log_activity(conn, "portal_wallet", wallet_id, "created", f"Created portal wallet '{payload.portal_name}'")
            row = conn.execute("SELECT * FROM portal_wallets WHERE id = ?", (wallet_id,)).fetchone()
            d = dict(row)
            d["is_low_balance"] = d["current_balance"] <= d["min_alert_balance"]
            return d
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=400, detail="Wallet with this name already exists")


@router.post("/wallets/{wallet_id}/topup", response_model=PortalWalletResponse)
def topup_portal_wallet(wallet_id: int, payload: WalletTopupRequest):
    """Recharges a portal wallet and logs the transaction."""
    now = now_utc_iso()
    today = today_date_str()
    with get_db() as conn:
        wallet = conn.execute("SELECT * FROM portal_wallets WHERE id = ?", (wallet_id,)).fetchone()
        if not wallet:
            raise HTTPException(status_code=404, detail="Portal wallet not found")

        new_balance = wallet["current_balance"] + payload.amount
        conn.execute(
            """UPDATE portal_wallets 
               SET current_balance = ?, last_recharge_date = ?, updated_at = ?
               WHERE id = ?""",
            (new_balance, today, now, wallet_id)
        )

        tx_notes = f"[{payload.payment_method}] {payload.notes or ''}".strip()
        conn.execute(
            """INSERT INTO wallet_transactions 
               (wallet_id, transaction_type, amount, balance_after, reference_no, transaction_date, notes, created_at)
               VALUES (?, 'topup', ?, ?, ?, ?, ?, ?)""",
            (wallet_id, payload.amount, new_balance, payload.reference_no, today, tx_notes, now)
        )

        log_activity(conn, "portal_wallet", wallet_id, "topup", f"Top-up of ₹{payload.amount/100:.2f} for {wallet['portal_name']}")

        updated = conn.execute("SELECT * FROM portal_wallets WHERE id = ?", (wallet_id,)).fetchone()
        d = dict(updated)
        d["is_low_balance"] = d["current_balance"] <= d["min_alert_balance"]
        return d


@router.get("/wallets/{wallet_id}/transactions", response_model=List[WalletTransactionResponse])
def get_wallet_transactions(wallet_id: int, limit: int = 50):
    """Lists transactions for a specific portal wallet."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM wallet_transactions WHERE wallet_id = ? ORDER BY id DESC LIMIT ?",
            (wallet_id, limit)
        ).fetchall()
        return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Department Work Orders (Mandated ₹20/unit)
# ---------------------------------------------------------------------------
@router.get("/dept-orders", response_model=List[DeptWorkOrderResponse])
def get_dept_work_orders():
    """Lists all state department bulk work orders."""
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM dept_work_orders ORDER BY id DESC").fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["total_claim_amount"] = d["completed_units"] * d["unit_rate"]
            tds = d.get("tds_deducted") or 0
            disallowed = d.get("disallowed_amount") or 0
            d["pending_claim_amount"] = max(0, d["total_claim_amount"] - d["amount_received"] - tds - disallowed)
            result.append(d)
        return result


@router.post("/dept-orders", response_model=DeptWorkOrderResponse, status_code=status.HTTP_201_CREATED)
def create_dept_work_order(payload: DeptWorkOrderCreate):
    """Creates a new state department task order."""
    now = now_utc_iso()
    total_claim = payload.completed_units * payload.unit_rate
    tds = getattr(payload, "tds_deducted", 0) or 0
    disallowed = getattr(payload, "disallowed_amount", 0) or 0
    with get_db() as conn:
        cur = conn.execute(
            """INSERT INTO dept_work_orders 
               (dept_name, scheme_name, order_ref, target_units, completed_units, unit_rate, total_claim_amount, amount_received, tds_deducted, disallowed_amount, claim_status, order_date, submission_date, disbursement_date, notes, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (payload.dept_name, payload.scheme_name, payload.order_ref, payload.target_units, payload.completed_units, payload.unit_rate, total_claim, tds, disallowed, payload.claim_status, payload.order_date or today_date_str(), payload.submission_date, payload.disbursement_date, payload.notes, now, now)
        )
        order_id = cur.lastrowid
        log_activity(conn, "dept_work_order", order_id, "created", f"Created dept order '{payload.scheme_name}' ({payload.completed_units} units @ ₹{payload.unit_rate/100:.2f})")

        row = conn.execute("SELECT * FROM dept_work_orders WHERE id = ?", (order_id,)).fetchone()
        d = dict(row)
        d["total_claim_amount"] = d["completed_units"] * d["unit_rate"]
        d["pending_claim_amount"] = max(0, d["total_claim_amount"] - d["amount_received"] - tds - disallowed)
        return d


@router.put("/dept-orders/{order_id}", response_model=DeptWorkOrderResponse)
def update_dept_work_order(order_id: int, payload: DeptWorkOrderUpdate):
    """Updates progress, unit rate, or payment receipt for a department order."""
    now = now_utc_iso()
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM dept_work_orders WHERE id = ?", (order_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Department work order not found")

        data = payload.model_dump(exclude_unset=True)
        updates = []
        params = []
        for k, v in data.items():
            updates.append(f"{k} = ?")
            params.append(v)

        if updates:
            new_units = data.get("completed_units", existing["completed_units"])
            new_rate = data.get("unit_rate", existing["unit_rate"])
            total_claim = new_units * new_rate
            updates.append("total_claim_amount = ?")
            params.append(total_claim)

            updates.append("updated_at = ?")
            params.append(now)
            params.append(order_id)
            conn.execute(f"UPDATE dept_work_orders SET {', '.join(updates)} WHERE id = ?", params)
            log_activity(conn, "dept_work_order", order_id, "updated", f"Updated dept order #{order_id}")

        row = conn.execute("SELECT * FROM dept_work_orders WHERE id = ?", (order_id,)).fetchone()
        d = dict(row)
        d["total_claim_amount"] = d["completed_units"] * d["unit_rate"]
        tds = d.get("tds_deducted") or 0
        disallowed = d.get("disallowed_amount") or 0
        d["pending_claim_amount"] = max(0, d["total_claim_amount"] - d["amount_received"] - tds - disallowed)
        return d


@router.delete("/dept-orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dept_work_order(order_id: int):
    """Deletes a department work order."""
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM dept_work_orders WHERE id = ?", (order_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Department work order not found")
        conn.execute("DELETE FROM dept_work_orders WHERE id = ?", (order_id,))
        log_activity(conn, "dept_work_order", order_id, "deleted", f"Deleted dept order #{order_id}")
        return None


# ---------------------------------------------------------------------------
# Gram Panchayat Remittances (Settlement of Panchayat Share Payable)
# ---------------------------------------------------------------------------
@router.get("/panchayat-remittances", response_model=List[PanchayatRemittanceResponse])
def get_panchayat_remittances(limit: int = 50):
    """Lists historical remittances made to the Gram Panchayat."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM panchayat_remittances ORDER BY remittance_date DESC, id DESC LIMIT ?",
            (limit,)
        ).fetchall()
        return [dict(r) for r in rows]


@router.post("/panchayat-remittances", response_model=PanchayatRemittanceResponse, status_code=status.HTTP_201_CREATED)
def create_panchayat_remittance(payload: PanchayatRemittanceCreate):
    """Records a royalty / revenue share payment to the Gram Panchayat with Talati receipt."""
    now = now_utc_iso()
    with get_db() as conn:
        cur = conn.execute(
            """INSERT INTO panchayat_remittances 
               (amount, payment_method, remittance_date, talati_receipt_no, period_from, period_to, notes, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (payload.amount, payload.payment_method, payload.remittance_date, payload.talati_receipt_no, payload.period_from, payload.period_to, payload.notes, now)
        )
        remit_id = cur.lastrowid
        log_activity(conn, "panchayat_remittance", remit_id, "created", f"Remitted ₹{payload.amount/100:.2f} to Gram Panchayat (Receipt: {payload.talati_receipt_no})")
        row = conn.execute("SELECT * FROM panchayat_remittances WHERE id = ?", (remit_id,)).fetchone()
        return dict(row)


# ---------------------------------------------------------------------------
# Rojmel Day Closing & Cash Denomination Reconciliations
# ---------------------------------------------------------------------------
@router.get("/rojmel/close-day/{date_str}", response_model=Optional[RojmelDayCloseResponse])
def get_rojmel_day_close(date_str: str):
    """Fetches day close information and physical cash breakdown for a date."""
    with get_db() as conn:
        row = conn.execute("SELECT * FROM rojmel_day_closes WHERE close_date = ?", (date_str,)).fetchone()
        if not row:
            return None
        d = dict(row)
        d["is_locked"] = bool(d["is_locked"])
        return d


@router.post("/rojmel/close-day", response_model=RojmelDayCloseResponse)
def close_rojmel_day(payload: RojmelDayCloseCreate):
    """Closes and locks the daily cash book with physical currency count and variance tracking."""
    now = now_utc_iso()
    with get_db() as conn:
        summary = get_daily_rojmel(payload.close_date)
        system_cash = summary.closing_cash
        variance = payload.physical_cash_total - system_cash

        conn.execute(
            """INSERT INTO rojmel_day_closes 
               (close_date, system_closing_cash, physical_cash_total, cash_variance, denominations_json, is_locked, closed_by, notes, created_at)
               VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
               ON CONFLICT(close_date) DO UPDATE SET
               system_closing_cash = excluded.system_closing_cash,
               physical_cash_total = excluded.physical_cash_total,
               cash_variance = excluded.cash_variance,
               denominations_json = excluded.denominations_json,
               closed_by = excluded.closed_by,
               notes = excluded.notes,
               created_at = excluded.created_at""",
            (payload.close_date, system_cash, payload.physical_cash_total, variance, payload.denominations_json, payload.closed_by, payload.notes, now)
        )
        row = conn.execute("SELECT * FROM rojmel_day_closes WHERE close_date = ?", (payload.close_date,)).fetchone()
        log_activity(conn, "rojmel", row["id"], "day_close", f"Closed Rojmel for {payload.close_date}: System ₹{system_cash/100:.2f}, Physical ₹{payload.physical_cash_total/100:.2f} (Variance: ₹{variance/100:.2f})")
        d = dict(row)
        d["is_locked"] = bool(d["is_locked"])
        return d


# ---------------------------------------------------------------------------
# Daily Rojmel (Daily Cash Book)
# ---------------------------------------------------------------------------
@router.get("/rojmel", response_model=RojmelSummary)
def get_daily_rojmel(target_date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format")):
    """Calculates traditional Gujarat e-Gram Rojmel (Daily Cash Book) for the given date."""
    date_str = target_date or today_date_str()

    with get_db() as conn:
        # Opening balances: sum of all payments & receipts prior to this date
        prior_cash_in = conn.execute(
            """SELECT COALESCE(SUM(amount), 0) AS total FROM payments 
               WHERE payment_date < ? AND payment_status = 'received' AND LOWER(payment_method) = 'cash'""",
            (date_str,)
        ).fetchone()["total"]

        prior_online_in = conn.execute(
            """SELECT COALESCE(SUM(amount), 0) AS total FROM payments 
               WHERE payment_date < ? AND payment_status = 'received' AND LOWER(payment_method) != 'cash' AND LOWER(payment_method) != 'udhar'""",
            (date_str,)
        ).fetchone()["total"]

        prior_dept_in = conn.execute(
            """SELECT COALESCE(SUM(amount_received), 0) AS total FROM dept_work_orders 
               WHERE disbursement_date < ?""",
            (date_str,)
        ).fetchone()["total"]

        prior_cash_out = conn.execute(
            """SELECT COALESCE(SUM(amount), 0) AS total FROM expenses 
               WHERE expense_date < ? AND is_archived = 0 AND LOWER(payment_method) = 'cash'""",
            (date_str,)
        ).fetchone()["total"]

        prior_online_out = conn.execute(
            """SELECT COALESCE(SUM(amount), 0) AS total FROM expenses 
               WHERE expense_date < ? AND is_archived = 0 AND LOWER(payment_method) != 'cash'""",
            (date_str,)
        ).fetchone()["total"]

        prior_wallet_cash = conn.execute(
            """SELECT COALESCE(SUM(amount), 0) AS total FROM wallet_transactions 
               WHERE transaction_date < ? AND transaction_type = 'topup' AND (LOWER(notes) LIKE '%[cash]%' OR LOWER(notes) LIKE '%cash%')""",
            (date_str,)
        ).fetchone()["total"]

        prior_wallet_online = conn.execute(
            """SELECT COALESCE(SUM(amount), 0) AS total FROM wallet_transactions 
               WHERE transaction_date < ? AND transaction_type = 'topup' AND NOT (LOWER(notes) LIKE '%[cash]%' OR LOWER(notes) LIKE '%cash%')""",
            (date_str,)
        ).fetchone()["total"]

        prior_remit_cash = conn.execute(
            """SELECT COALESCE(SUM(amount), 0) AS total FROM panchayat_remittances 
               WHERE remittance_date < ? AND LOWER(payment_method) = 'cash'""",
            (date_str,)
        ).fetchone()["total"]

        prior_remit_online = conn.execute(
            """SELECT COALESCE(SUM(amount), 0) AS total FROM panchayat_remittances 
               WHERE remittance_date < ? AND LOWER(payment_method) != 'cash'""",
            (date_str,)
        ).fetchone()["total"]

        # Exact opening positions without zero-clamping
        opening_cash = prior_cash_in - (prior_cash_out + prior_wallet_cash + prior_remit_cash)
        opening_bank = (prior_online_in + prior_dept_in) - (prior_online_out + prior_wallet_online + prior_remit_online)

        # Today's Citizen Inflows
        today_cash_in = conn.execute(
            """SELECT COALESCE(SUM(amount), 0) AS total FROM payments 
               WHERE payment_date = ? AND payment_status = 'received' AND LOWER(payment_method) = 'cash'""",
            (date_str,)
        ).fetchone()["total"]

        today_upi_in = conn.execute(
            """SELECT COALESCE(SUM(amount), 0) AS total FROM payments 
               WHERE payment_date = ? AND payment_status = 'received' AND LOWER(payment_method) IN ('online', 'upi', 'bank transfer')""",
            (date_str,)
        ).fetchone()["total"]

        today_dept_in = conn.execute(
            """SELECT COALESCE(SUM(amount_received), 0) AS total FROM dept_work_orders 
               WHERE disbursement_date = ?""",
            (date_str,)
        ).fetchone()["total"]

        # Today's Outflows
        today_exp_cash = conn.execute(
            """SELECT COALESCE(SUM(amount), 0) AS total FROM expenses 
               WHERE expense_date = ? AND is_archived = 0 AND LOWER(payment_method) = 'cash'""",
            (date_str,)
        ).fetchone()["total"]

        today_exp_online = conn.execute(
            """SELECT COALESCE(SUM(amount), 0) AS total FROM expenses 
               WHERE expense_date = ? AND is_archived = 0 AND LOWER(payment_method) != 'cash'""",
            (date_str,)
        ).fetchone()["total"]

        today_wallet_recharges_cash = conn.execute(
            """SELECT COALESCE(SUM(amount), 0) AS total FROM wallet_transactions 
               WHERE transaction_date = ? AND transaction_type = 'topup' AND (LOWER(notes) LIKE '%[cash]%' OR LOWER(notes) LIKE '%cash%')""",
            (date_str,)
        ).fetchone()["total"]

        today_wallet_recharges_online = conn.execute(
            """SELECT COALESCE(SUM(amount), 0) AS total FROM wallet_transactions 
               WHERE transaction_date = ? AND transaction_type = 'topup' AND NOT (LOWER(notes) LIKE '%[cash]%' OR LOWER(notes) LIKE '%cash%')""",
            (date_str,)
        ).fetchone()["total"]

        today_remit_cash = conn.execute(
            """SELECT COALESCE(SUM(amount), 0) AS total FROM panchayat_remittances 
               WHERE remittance_date = ? AND LOWER(payment_method) = 'cash'""",
            (date_str,)
        ).fetchone()["total"]

        today_remit_online = conn.execute(
            """SELECT COALESCE(SUM(amount), 0) AS total FROM panchayat_remittances 
               WHERE remittance_date = ? AND LOWER(payment_method) != 'cash'""",
            (date_str,)
        ).fetchone()["total"]

        today_wallet_topups = today_wallet_recharges_cash + today_wallet_recharges_online
        today_panchayat_remitted = today_remit_cash + today_remit_online

        # Today's Udhar
        today_udhar_given = conn.execute(
            """SELECT COALESCE(SUM(agreed_amount), 0) AS total FROM work 
               WHERE start_date = ? AND is_archived = 0 AND id NOT IN (SELECT work_id FROM payments WHERE payment_date = ?)""",
            (date_str, date_str)
        ).fetchone()["total"]

        today_udhar_recovered = conn.execute(
            """SELECT COALESCE(SUM(amount), 0) AS total FROM payments 
               WHERE payment_date = ? AND payment_status = 'received' AND LOWER(notes) LIKE '%udhar%'""",
            (date_str,)
        ).fetchone()["total"]

        total_aavak = today_cash_in + today_upi_in + today_dept_in
        total_javak = today_exp_cash + today_exp_online + today_wallet_topups + today_panchayat_remitted
        closing_cash = opening_cash + today_cash_in - (today_exp_cash + today_wallet_recharges_cash + today_remit_cash)
        closing_bank = opening_bank + today_upi_in + today_dept_in - (today_exp_online + today_wallet_recharges_online + today_remit_online)
        is_cash_deficit = closing_cash < 0

        # Net commission earned today
        comm_today_row = conn.execute(
            """SELECT COALESCE(SUM(vce_commission), 0) AS comm FROM work 
               WHERE (start_date = ? OR completed_date = ?) AND status IN ('Completed', 'Completed / Delivered') AND is_archived = 0""",
            (date_str, date_str)
        ).fetchone()
        net_commission_earned = (comm_today_row["comm"] if comm_today_row else 0) + today_dept_in

        # Build detailed journal entries
        entries = []
        # Inflow rows
        pay_rows = conn.execute(
            """SELECT p.amount, p.payment_method, p.payment_time, p.transaction_reference, per.name AS person_name, w.title AS work_title
               FROM payments p
               JOIN people per ON p.person_id = per.id
               LEFT JOIN work w ON p.work_id = w.id
               WHERE p.payment_date = ? AND p.payment_status = 'received'
               ORDER BY p.payment_time ASC""",
            (date_str,)
        ).fetchall()
        for r in pay_rows:
            entries.append(RojmelDayRow(
                type="aavak",
                category="Citizen Collection",
                title=f"{r['person_name']} — {r['work_title'] or 'Service Fee'}",
                method=r["payment_method"],
                amount=r["amount"],
                time=r["payment_time"] or "10:00",
                reference=r["transaction_reference"]
            ))

        # Dept orders disbursed today
        dept_rows = conn.execute(
            """SELECT scheme_name, dept_name, amount_received, order_ref FROM dept_work_orders
               WHERE disbursement_date = ?""",
            (date_str,)
        ).fetchall()
        for d in dept_rows:
            entries.append(RojmelDayRow(
                type="aavak",
                category="State Dept Disbursal",
                title=f"{d['dept_name']} — {d['scheme_name']}",
                method="Bank Transfer",
                amount=d["amount_received"],
                time="11:30",
                reference=d["order_ref"]
            ))

        # Expense rows
        exp_rows = conn.execute(
            """SELECT e.amount, e.payment_method, e.expense_time, e.title, ec.name AS cat_name
               FROM expenses e
               LEFT JOIN expense_categories ec ON e.category_id = ec.id
               WHERE e.expense_date = ? AND e.is_archived = 0
               ORDER BY e.expense_time ASC""",
            (date_str,)
        ).fetchall()
        for r in exp_rows:
            entries.append(RojmelDayRow(
                type="javak",
                category=r["cat_name"] or "Center Expense",
                title=r["title"],
                method=r["payment_method"],
                amount=r["amount"],
                time=r["expense_time"] or "12:00",
                reference=None
            ))

        # Wallet recharges today (Javak - Contra transfer)
        wallet_txs = conn.execute(
            """SELECT wt.amount, wt.reference_no, wt.notes, pw.portal_name 
               FROM wallet_transactions wt
               JOIN portal_wallets pw ON wt.wallet_id = pw.id
               WHERE wt.transaction_date = ? AND wt.transaction_type = 'topup'""",
            (date_str,)
        ).fetchall()
        for w in wallet_txs:
            method = "Cash" if "[cash]" in (w["notes"] or "").lower() else "UPI / Bank"
            entries.append(RojmelDayRow(
                type="javak",
                category="Portal Float Recharge",
                title=f"Recharge: {w['portal_name']}",
                method=method,
                amount=w["amount"],
                time="14:00",
                reference=w["reference_no"]
            ))

        # Panchayat remittances today (Javak - Settlement)
        remit_rows = conn.execute(
            """SELECT amount, payment_method, talati_receipt_no, notes FROM panchayat_remittances
               WHERE remittance_date = ?""",
            (date_str,)
        ).fetchall()
        for rm in remit_rows:
            entries.append(RojmelDayRow(
                type="javak",
                category="Panchayat Royalty Remittance",
                title=f"Remitted to Gram Panchayat (Talati Rcpt: {rm['talati_receipt_no']})",
                method=rm["payment_method"],
                amount=rm["amount"],
                time="16:00",
                reference=rm["talati_receipt_no"]
            ))

        # Day close info
        day_close_row = conn.execute("SELECT * FROM rojmel_day_closes WHERE close_date = ?", (date_str,)).fetchone()
        day_close_info = None
        if day_close_row:
            d_close = dict(day_close_row)
            d_close["is_locked"] = bool(d_close["is_locked"])
            day_close_info = RojmelDayCloseResponse(**d_close)

        return RojmelSummary(
            date=date_str,
            opening_cash=opening_cash,
            opening_bank=opening_bank,
            today_citizen_cash=today_cash_in,
            today_citizen_upi=today_upi_in,
            today_dept_received=today_dept_in,
            total_aavak=total_aavak,
            today_expenses_cash=today_exp_cash,
            today_expenses_online=today_exp_online,
            today_wallet_topups=today_wallet_topups,
            today_wallet_recharges_cash=today_wallet_recharges_cash,
            today_wallet_recharges_online=today_wallet_recharges_online,
            today_panchayat_remitted=today_panchayat_remitted,
            total_javak=total_javak,
            closing_cash=closing_cash,
            closing_bank=closing_bank,
            is_cash_deficit=is_cash_deficit,
            today_net_earnings=max(0, total_aavak - total_javak),
            net_commission_earned=net_commission_earned,
            today_udhar_given=today_udhar_given,
            today_udhar_recovered=today_udhar_recovered,
            day_close_info=day_close_info,
            entries=entries
        )
