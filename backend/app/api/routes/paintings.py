"""HTTP endpoints for uploading and browsing analysed paintings."""

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.api.dependencies import (
    get_image_storage,
    get_painting_repository,
    get_painting_service,
    require_auth,
)
from app.interfaces.element_detector import DetectionError
from app.repositories.painting_repository import PaintingRepository
from app.interfaces.image_storage import ImageStorage
from app.schemas.painting import PaintingCreate, PaintingDetail, PaintingSummary, PaintingUpdate
from app.services.painting_service import PaintingService

from app.models.painting import Painting

router = APIRouter(prefix="/api/paintings", tags=["paintings"])

_ALLOWED_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"}


def painting_to_detail(painting: Painting) -> PaintingDetail:
    """Build the API response, hiding soft-deleted elements (which stay in the DB)."""

    visible_ids = {e.id for e in painting.elements if not e.is_deleted}
    detail = PaintingDetail.model_validate(painting)
    detail.elements = [e for e in detail.elements if e.id in visible_ids]
    return detail


@router.post("", response_model=PaintingDetail, status_code=status.HTTP_201_CREATED)
async def upload_painting(
    file: UploadFile = File(...),
    title: str | None = Form(None),
    artist: str | None = Form(None),
    year: str | None = Form(None),
    notes: str | None = Form(None),
    location_owner: str | None = Form(None),
    location_city: str | None = Form(None),
    location_country: str | None = Form(None),
    service: PaintingService = Depends(get_painting_service),
    _: None = Depends(require_auth),
) -> PaintingDetail:
    if file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported image type: {file.content_type or 'unknown'}",
        )

    data = await file.read()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file upload."
        )

    meta = PaintingCreate(
        title=title,
        artist=artist,
        year=year,
        notes=notes,
        location_owner=location_owner,
        location_city=location_city,
        location_country=location_country,
    )
    try:
        painting = service.analyze_and_store(
            data=data,
            original_filename=file.filename or "untitled.png",
            content_type=file.content_type or "image/png",
            meta=meta,
        )
    except DetectionError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)
        ) from exc
    return painting_to_detail(painting)


@router.get("", response_model=list[PaintingSummary])
def list_paintings(
    repository: PaintingRepository = Depends(get_painting_repository),
) -> list[PaintingSummary]:
    paintings = repository.list_all()
    return [
        PaintingSummary(
            id=p.id,
            title=p.title,
            artist=p.artist,
            year=p.year,
            filename=p.filename,
            width=p.width,
            height=p.height,
            created_at=p.created_at,
            element_count=sum(1 for e in p.elements if not e.is_deleted),
        )
        for p in paintings
    ]


@router.get("/{painting_id}", response_model=PaintingDetail)
def get_painting(
    painting_id: int,
    repository: PaintingRepository = Depends(get_painting_repository),
) -> PaintingDetail:
    painting = repository.get(painting_id)
    if painting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Painting not found."
        )
    return painting_to_detail(painting)


@router.delete("/{painting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_painting(
    painting_id: int,
    repository: PaintingRepository = Depends(get_painting_repository),
    storage: ImageStorage = Depends(get_image_storage),
    _: None = Depends(require_auth),
) -> None:
    painting = repository.delete(painting_id)
    if painting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Painting not found."
        )
    file_path = storage.path_for(painting.filename)
    if file_path.exists():
        file_path.unlink()


@router.patch("/{painting_id}", response_model=PaintingDetail)
def update_painting(
    painting_id: int,
    body: PaintingUpdate,
    repository: PaintingRepository = Depends(get_painting_repository),
    _: None = Depends(require_auth),
) -> PaintingDetail:
    painting = repository.update(painting_id, body)
    if painting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Painting not found."
        )
    return painting_to_detail(painting)
