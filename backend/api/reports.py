"""API Endpoints for Reports and File Exports."""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Response
from backend.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])
service = ReportService()


@router.get("")
def get_report(
    type: str = Query("revenue", description="revenue, expense, profit, person_wise, work_wise, outstanding, payment_method, balance_sheet, accrual_pnl"),
    report_type: Optional[str] = Query(None),
    preset: str = Query("this_month"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    actual_type = report_type or type
    try:
        return service.get_financial_report(
            report_type=actual_type,
            preset=preset,
            start_date=start_date,
            end_date=end_date
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/export")
def export_report(
    type: str = Query("revenue"),
    report_type: Optional[str] = Query(None),
    format: str = Query("csv", description="csv, excel, pdf"),
    preset: str = Query("this_month"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    actual_type = report_type or type
    try:
        content, media_type = service.export(
            report_type=actual_type,
            format_type=format,
            preset=preset,
            start_date=start_date,
            end_date=end_date
        )
        extension = "csv" if format == "csv" else ("xlsx" if format == "excel" else "pdf")
        filename = f"{actual_type}_report_{preset}.{extension}"
        headers = {"Content-Disposition": f"attachment; filename={filename}"}
        return Response(content=content, media_type=media_type, headers=headers)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
