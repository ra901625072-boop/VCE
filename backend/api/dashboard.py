"""API Endpoints for Dashboard analytics and metrics."""
from typing import Optional
from fastapi import APIRouter, Query
from backend.schemas.dashboard import DashboardResponse
from backend.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
service = DashboardService()


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    preset: str = Query("this_month", description="today, yesterday, this_week, this_month, this_year, all, custom"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD) for custom range"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD) for custom range")
):
    return service.get_dashboard_data(preset=preset, start_date=start_date, end_date=end_date)
