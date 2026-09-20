"""API Endpoints for Search and Multi-Criteria Filtering."""
from typing import List, Optional
from fastapi import APIRouter, Query
from backend.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["Search"])
service = SearchService()


@router.get("")
def search(
    q: Optional[str] = Query(None, description="Free-text search across titles, names, references"),
    types: Optional[List[str]] = Query(None, description="Entity types: work, payment, expense, person"),
    preset: Optional[str] = Query(None, description="Date preset: today, this_month, etc."),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    min_amount: Optional[int] = Query(None, description="Minimum amount in paise"),
    max_amount: Optional[int] = Query(None, description="Maximum amount in paise"),
    person_id: Optional[int] = Query(None),
    payment_method: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None)
):
    return service.unified_search(
        query=q,
        entity_types=types,
        preset=preset,
        date_from=date_from,
        date_to=date_to,
        min_amount=min_amount,
        max_amount=max_amount,
        person_id=person_id,
        payment_method=payment_method,
        status=status,
        category=category
    )
