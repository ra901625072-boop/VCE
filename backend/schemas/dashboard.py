"""Schemas for Dashboard and Analytics metrics."""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class MetricSummary(BaseModel):
    today_revenue: int = 0
    today_expenses: int = 0
    today_profit: int = 0
    today_work_count: int = 0
    
    period_revenue: int = 0
    period_expenses: int = 0
    period_profit: int = 0
    expected_profit: int = 0
    
    total_pending_udhar: int = 0
    active_work_count: int = 0
    completed_work_count: int = 0

    # VCE Pali Specific Metrics
    today_citizen_cash: int = 0
    today_citizen_upi: int = 0
    pending_dept_claims: int = 0
    portal_wallets_balance: int = 0
    panchayat_share_payable: int = 0
    total_panchayat_share_earned: int = 0
    total_panchayat_remitted: int = 0
    gross_citizen_collections: int = 0
    net_commission_revenue: int = 0
    tds_receivable: int = 0


class BreakdownItem(BaseModel):
    label: str
    amount: int = 0
    count: int = 0
    percentage: float = 0.0


class TrendPoint(BaseModel):
    date: str
    revenue: int = 0
    expenses: int = 0
    profit: int = 0


class DashboardResponse(BaseModel):
    date_preset: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    metrics: MetricSummary
    revenue_vs_expenses_trend: List[TrendPoint] = []
    expenses_by_category: List[BreakdownItem] = []
    payments_by_method: List[BreakdownItem] = []
    work_status_distribution: List[BreakdownItem] = []
    todays_work: List[Dict[str, Any]] = []
    upcoming_deadlines: List[Dict[str, Any]] = []
    recent_payments: List[Dict[str, Any]] = []
    recent_expenses: List[Dict[str, Any]] = []
    panchayat_profile: Optional[Dict[str, Any]] = None
    portal_wallets: List[Dict[str, Any]] = []
    pending_dept_orders: List[Dict[str, Any]] = []
