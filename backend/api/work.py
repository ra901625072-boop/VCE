"""API Endpoints for Work / Jobs."""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from backend.schemas.work import WorkCreate, WorkUpdate, WorkResponse
from backend.services.work_service import WorkService
from backend.core.exceptions import NotFoundException

router = APIRouter(prefix="/work", tags=["Work"])
service = WorkService()


@router.post("", response_model=WorkResponse, status_code=status.HTTP_201_CREATED)
def create_work(payload: WorkCreate):
    try:
        return service.create(payload)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[WorkResponse])
def list_work(
    person_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    deadline_from: Optional[str] = Query(None),
    deadline_to: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    include_archived: bool = Query(False)
):
    return service.list_all(
        person_id=person_id,
        status=status,
        category=category,
        priority=priority,
        deadline_from=deadline_from,
        deadline_to=deadline_to,
        query=q,
        include_archived=include_archived
    )


@router.get("/{work_id}", response_model=WorkResponse)
def get_work(work_id: int):
    try:
        return service.get_by_id(work_id)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)


@router.get("/{work_id}/timeline")
def get_work_timeline(work_id: int):
    try:
        return service.get_timeline(work_id)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)


@router.put("/{work_id}", response_model=WorkResponse)
def update_work(work_id: int, payload: WorkUpdate):
    try:
        return service.update(work_id, payload)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{work_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work(work_id: int, cascade: bool = Query(False)):
    try:
        service.delete(work_id, cascade=cascade)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
