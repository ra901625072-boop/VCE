"""Pydantic schemas for VCE Pali e-Gram features."""
from typing import Optional, List
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Panchayat Center Profile
# ---------------------------------------------------------------------------
class PanchayatProfileBase(BaseModel):
    district: str = Field(default="", max_length=100, description="District")
    taluka: str = Field(default="", max_length=100, description="Taluka")
    gram_panchayat: str = Field(default="", max_length=200, description="Gram Panchayat")
    center_id: str = Field(default="", max_length=50, description="e-Gram Kendra Code")
    vce_name: str = Field(default="", max_length=150, description="VCE Operator Full Name")
    vce_phone: str = Field(default="", max_length=50, description="VCE Mobile Number")
    talati_name: str = Field(default="", max_length=150, description="Talati-cum-Mantri")


class PanchayatProfileUpdate(BaseModel):
    district: Optional[str] = None
    taluka: Optional[str] = None
    gram_panchayat: Optional[str] = None
    center_id: Optional[str] = None
    vce_name: Optional[str] = None
    vce_phone: Optional[str] = None
    talati_name: Optional[str] = None


class PanchayatProfileResponse(PanchayatProfileBase):
    id: int = 1
    updated_at: str


# ---------------------------------------------------------------------------
# Portal Wallets
# ---------------------------------------------------------------------------
class PortalWalletBase(BaseModel):
    portal_name: str = Field(..., max_length=100, description="Portal Name (Digital Gujarat, AnyRoR, etc.)")
    min_alert_balance: int = Field(default=10000, ge=0, description="Minimum alert threshold in paise")


class PortalWalletCreate(PortalWalletBase):
    current_balance: int = Field(default=0, ge=0, description="Initial balance in paise")


class PortalWalletUpdate(BaseModel):
    portal_name: Optional[str] = None
    min_alert_balance: Optional[int] = Field(None, ge=0)


class PortalWalletResponse(PortalWalletBase):
    id: int
    current_balance: int
    is_low_balance: bool = False
    last_recharge_date: Optional[str] = None
    updated_at: str


class WalletTopupRequest(BaseModel):
    amount: int = Field(..., gt=0, description="Top-up amount in paise")
    reference_no: Optional[str] = Field(None, max_length=100, description="Bank / UPI Txn Ref")
    payment_method: str = Field(default="UPI", max_length=50)
    notes: Optional[str] = None


class WalletTransactionResponse(BaseModel):
    id: int
    wallet_id: int
    transaction_type: str
    amount: int
    balance_after: int
    reference_no: Optional[str] = None
    transaction_date: str
    notes: Optional[str] = None
    created_at: str


# ---------------------------------------------------------------------------
# Department Work Orders (Mandated ₹20/unit State Govt Tasks)
# ---------------------------------------------------------------------------
class DeptWorkOrderBase(BaseModel):
    dept_name: str = Field(..., max_length=150, description="Department Name (Health, Agriculture, Election, etc.)")
    scheme_name: str = Field(..., max_length=200, description="Scheme or Campaign Name")
    order_ref: Optional[str] = Field(None, max_length=100, description="Order / Circular / File Ref No.")
    target_units: int = Field(default=0, ge=0, description="Target entries count")
    completed_units: int = Field(default=0, ge=0, description="Completed entries count")
    unit_rate: int = Field(default=2000, ge=0, description="Unit rate in paise (Default ₹20 = 2000 paise)")
    tds_deducted: int = Field(default=0, ge=0, description="TDS under Sec 194C in paise")
    disallowed_amount: int = Field(default=0, ge=0, description="Disallowed claim deductions in paise")
    claim_status: str = Field(default="In Progress", max_length=50)
    order_date: Optional[str] = None
    submission_date: Optional[str] = None
    disbursement_date: Optional[str] = None
    notes: Optional[str] = None


class DeptWorkOrderCreate(DeptWorkOrderBase):
    pass


class DeptWorkOrderUpdate(BaseModel):
    dept_name: Optional[str] = None
    scheme_name: Optional[str] = None
    order_ref: Optional[str] = None
    target_units: Optional[int] = Field(None, ge=0)
    completed_units: Optional[int] = Field(None, ge=0)
    unit_rate: Optional[int] = Field(None, ge=0)
    tds_deducted: Optional[int] = Field(None, ge=0)
    disallowed_amount: Optional[int] = Field(None, ge=0)
    claim_status: Optional[str] = None
    amount_received: Optional[int] = Field(None, ge=0)
    order_date: Optional[str] = None
    submission_date: Optional[str] = None
    disbursement_date: Optional[str] = None
    notes: Optional[str] = None


class DeptWorkOrderResponse(DeptWorkOrderBase):
    id: int
    total_claim_amount: int = 0
    amount_received: int = 0
    pending_claim_amount: int = 0
    created_at: str
    updated_at: str


# ---------------------------------------------------------------------------
# Gram Panchayat Remittance (Settlement of Panchayat Share Payable)
# ---------------------------------------------------------------------------
class PanchayatRemittanceCreate(BaseModel):
    amount: int = Field(..., gt=0, description="Remittance amount in paise")
    payment_method: str = Field(default="Cash", max_length=50)
    remittance_date: str = Field(..., description="Date paid to Gram Panchayat in YYYY-MM-DD")
    talati_receipt_no: str = Field(..., max_length=100, description="Receipt number issued by Talati-cum-Mantri")
    period_from: Optional[str] = None
    period_to: Optional[str] = None
    notes: Optional[str] = None


class PanchayatRemittanceResponse(BaseModel):
    id: int
    amount: int
    payment_method: str
    remittance_date: str
    talati_receipt_no: str
    period_from: Optional[str] = None
    period_to: Optional[str] = None
    notes: Optional[str] = None
    created_at: str


# ---------------------------------------------------------------------------
# Rojmel Day Closing & Cash Denomination Reconciliations
# ---------------------------------------------------------------------------
class RojmelDayCloseCreate(BaseModel):
    close_date: str = Field(..., description="Date of daybook closing (YYYY-MM-DD)")
    physical_cash_total: int = Field(..., ge=0, description="Total physically counted currency in paise")
    denominations_json: str = Field(default="{}", description="JSON string of counts: {'500': 1, '200': 2...}")
    closed_by: str = Field(default="VCE Operator", max_length=150)
    notes: Optional[str] = None


class RojmelDayCloseResponse(BaseModel):
    id: int
    close_date: str
    system_closing_cash: int
    physical_cash_total: int
    cash_variance: int
    denominations_json: str
    is_locked: bool = True
    closed_by: str
    notes: Optional[str] = None
    created_at: str


# ---------------------------------------------------------------------------
# Service Catalog Item
# ---------------------------------------------------------------------------
class ServiceCatalogItem(BaseModel):
    id: str
    category: str
    name: str
    name_gu: str
    portal: str
    standard_fee: int  # in paise
    portal_cost: int   # in paise
    panchayat_share: int # in paise
    vce_commission: int  # in paise
    description: str


# ---------------------------------------------------------------------------
# Daily Rojmel (Daily Cash Book)
# ---------------------------------------------------------------------------
class RojmelDayRow(BaseModel):
    type: str  # 'aavak' (inflow/receipt) or 'javak' (outflow/expense)
    category: str
    title: str
    method: str
    amount: int  # in paise
    time: str
    reference: Optional[str] = None


class RojmelSummary(BaseModel):
    date: str
    opening_cash: int
    opening_bank: int
    today_citizen_cash: int
    today_citizen_upi: int
    today_dept_received: int
    total_aavak: int
    today_expenses_cash: int
    today_expenses_online: int
    today_wallet_topups: int
    today_wallet_recharges_cash: int = 0
    today_wallet_recharges_online: int = 0
    today_panchayat_remitted: int = 0
    total_javak: int
    closing_cash: int
    closing_bank: int
    is_cash_deficit: bool = False
    today_net_earnings: int
    net_commission_earned: int = 0
    today_udhar_given: int
    today_udhar_recovered: int
    day_close_info: Optional[RojmelDayCloseResponse] = None
    entries: List[RojmelDayRow]
