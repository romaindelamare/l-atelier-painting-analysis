"""HTTP endpoints for uploading and browsing analysed paintings."""

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.api.dependencies import get_painting_repository, get_painting_service
from app.interfaces.element_detector import DetectionError
from app.repositories.painting_repository import PaintingRepository
from app.schemas.painting import PaintingCreate, PaintingDetail, PaintingSummary
from app.services.painting_service import PaintingService

router = APIRouter(prefix="/api/paintings", tags=["paintings"])

_ALLOWED_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"}


@router.post("", response_model=PaintingDetail, status_code=status.HTTP_201_CREATED)
async def upload_painting(
    file: UploadFile = File(...),
    title: str | None = Form(None),
    artist: str | None = Form(None),
    year: str | None = Form(None),
    notes: str | None = Form(None),
    service: PaintingService = Depends(get_painting_service),
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

    meta = PaintingCreate(title=title, artist=artist, year=year, notes=notes)
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
    return PaintingDetail.model_validate(painting)


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
            element_count=len(p.elements),
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
    return PaintingDetail.model_validate(painting)
