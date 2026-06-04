"""HTTP endpoints for curating the elements detected within a painting.

All of these mutate the detection and so require authentication. Each returns the
full, refreshed :class:`PaintingDetail` so the frontend can simply replace its state.
The original LLM detection is never destroyed: deletes are soft and every element keeps
a frozen snapshot, which the ``/revert`` endpoint restores.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_painting_repository, require_auth
from app.api.routes.paintings import painting_to_detail
from app.models.detected_element import DetectedElement
from app.repositories.painting_repository import PaintingRepository
from app.schemas.painting import (
    ElementBulkDelete,
    ElementCreate,
    ElementUpdate,
    PaintingDetail,
)

router = APIRouter(prefix="/api/paintings/{painting_id}/elements", tags=["elements"])


def _detail_or_404(painting) -> PaintingDetail:
    if painting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Painting not found."
        )
    return painting_to_detail(painting)


def _ensure_element(
    repository: PaintingRepository, painting_id: int, element_id: int
) -> DetectedElement:
    element = repository.get_element(element_id)
    if element is None or element.painting_id != painting_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Element not found."
        )
    return element


@router.post("", response_model=PaintingDetail, status_code=status.HTTP_201_CREATED)
def create_element(
    painting_id: int,
    body: ElementCreate,
    repository: PaintingRepository = Depends(get_painting_repository),
    _: None = Depends(require_auth),
) -> PaintingDetail:
    name = body.specific_type or body.subcategory or body.category
    element = DetectedElement(
        name=name,
        category=body.category,
        subcategory=body.subcategory,
        specific_type=body.specific_type,
        top_left_x=body.top_left_x,
        top_left_y=body.top_left_y,
        bottom_right_x=body.bottom_right_x,
        bottom_right_y=body.bottom_right_y,
    )
    return _detail_or_404(repository.add_element(painting_id, element))


@router.patch("/{element_id}", response_model=PaintingDetail)
def update_element(
    painting_id: int,
    element_id: int,
    body: ElementUpdate,
    repository: PaintingRepository = Depends(get_painting_repository),
    _: None = Depends(require_auth),
) -> PaintingDetail:
    _ensure_element(repository, painting_id, element_id)
    repository.update_element(element_id, body)
    return _detail_or_404(repository.get(painting_id))


@router.delete("/{element_id}", response_model=PaintingDetail)
def delete_element(
    painting_id: int,
    element_id: int,
    repository: PaintingRepository = Depends(get_painting_repository),
    _: None = Depends(require_auth),
) -> PaintingDetail:
    _ensure_element(repository, painting_id, element_id)
    repository.soft_delete_elements(painting_id, [element_id])
    return _detail_or_404(repository.get(painting_id))


@router.post("/bulk-delete", response_model=PaintingDetail)
def bulk_delete_elements(
    painting_id: int,
    body: ElementBulkDelete,
    repository: PaintingRepository = Depends(get_painting_repository),
    _: None = Depends(require_auth),
) -> PaintingDetail:
    if repository.get(painting_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Painting not found."
        )
    repository.soft_delete_elements(painting_id, body.ids)
    return _detail_or_404(repository.get(painting_id))


@router.post("/renumber", response_model=PaintingDetail)
def renumber_elements(
    painting_id: int,
    repository: PaintingRepository = Depends(get_painting_repository),
    _: None = Depends(require_auth),
) -> PaintingDetail:
    return _detail_or_404(repository.renumber(painting_id))


@router.post("/revert", response_model=PaintingDetail)
def revert_elements(
    painting_id: int,
    repository: PaintingRepository = Depends(get_painting_repository),
    _: None = Depends(require_auth),
) -> PaintingDetail:
    return _detail_or_404(repository.revert(painting_id))
