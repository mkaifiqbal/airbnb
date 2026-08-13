"""
Image upload routes with Cloudinary integration.
"""
from typing import List
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException

from app.auth import require_auth
from app.models import User
from app.cloudinary_utils import upload_to_cloudinary
from app.schemas import UploadResponse, MultiUploadResponse

router = APIRouter(prefix="/api", tags=["upload"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    user: User = Depends(require_auth),
):
    """
    Upload a single image: compress with Pillow, then upload to Cloudinary.
    Returns the Cloudinary URL.
    """
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_TYPES)}",
        )

    # Read file bytes
    file_bytes = await file.read()

    # Validate file size
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB",
        )

    try:
        result = upload_to_cloudinary(file_bytes, compress=True)
        return UploadResponse(url=result["url"], public_id=result["public_id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/upload/multiple", response_model=MultiUploadResponse)
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    user: User = Depends(require_auth),
):
    """
    Upload multiple images (up to 10). Each is compressed and uploaded to Cloudinary.
    """
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 images per upload")

    results = []
    for file in files:
        if file.content_type not in ALLOWED_TYPES:
            continue  # Skip invalid files

        file_bytes = await file.read()
        if len(file_bytes) > MAX_FILE_SIZE:
            continue  # Skip oversized files

        try:
            result = upload_to_cloudinary(file_bytes, compress=True)
            results.append(UploadResponse(url=result["url"], public_id=result["public_id"]))
        except Exception:
            continue  # Skip failed uploads

    return MultiUploadResponse(images=results)
