"""API Endpoints for People / Clients."""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from backend.schemas.person import PersonCreate, PersonUpdate, PersonResponse
from backend.services.person_service import PersonService
from backend.core.exceptions import NotFoundException

router = APIRouter(prefix="/people", tags=["People"])
service = PersonService()


@router.post("", response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
def create_person(payload: PersonCreate):
    try:
        return service.create(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[PersonResponse])
def list_people(
    q: Optional[str] = Query(None, description="Search query by name, phone, or company"),
    include_archived: bool = Query(False, description="Include archived people")
):
    return service.list_all(query=q, include_archived=include_archived)


@router.get("/{person_id}", response_model=PersonResponse)
def get_person(person_id: int):
    try:
        return service.get_by_id(person_id)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)


@router.get("/{person_id}/detail")
def get_person_detail(person_id: int):
    try:
        return service.get_full_detail(person_id)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)


@router.put("/{person_id}", response_model=PersonResponse)
def update_person(person_id: int, payload: PersonUpdate):
    try:
        return service.update(person_id, payload)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_person(person_id: int, cascade: bool = Query(False)):
    try:
        service.delete(person_id, cascade=cascade)
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
