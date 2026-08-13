"""
Cloudinary image upload utilities with Pillow-based compression.
"""
import io
import os
import uuid
from typing import Optional

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

# Configure Cloudinary — prefer CLOUDINARY_URL (auto-configures everything)
cloudinary_url = os.getenv("CLOUDINARY_URL")
if cloudinary_url:
    cloudinary.config(cloudinary_url=cloudinary_url)
else:
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", ""),
        api_key=os.getenv("CLOUDINARY_API_KEY", ""),
        api_secret=os.getenv("CLOUDINARY_API_SECRET", ""),
    )


def compress_image(
    file_bytes: bytes,
    max_size: int = 1200,
    quality: int = 85,
    format: str = "JPEG",
) -> io.BytesIO:
    """
    Compress and resize an image before uploading.
    
    Args:
        file_bytes: Raw image bytes
        max_size: Maximum dimension (width or height) in pixels
        quality: JPEG compression quality (1-100)
        format: Output format (JPEG, WEBP, PNG)
    
    Returns:
        BytesIO buffer with compressed image
    """
    image = Image.open(io.BytesIO(file_bytes))

    # Convert RGBA/P → RGB (JPEG doesn't support alpha)
    if image.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", image.size, (255, 255, 255))
        if image.mode == "P":
            image = image.convert("RGBA")
        background.paste(image, mask=image.split()[-1] if "A" in image.mode else None)
        image = background

    # Resize: max dimension on longest side, preserve aspect ratio
    image.thumbnail((max_size, max_size), Image.LANCZOS)

    # Compress to buffer
    buffer = io.BytesIO()
    save_kwargs = {"format": format, "optimize": True}
    if format in ("JPEG", "WEBP"):
        save_kwargs["quality"] = quality
    image.save(buffer, **save_kwargs)
    buffer.seek(0)

    return buffer


def upload_to_cloudinary(
    file_bytes: bytes,
    filename: Optional[str] = None,
    folder: str = "airbnb_clone",
    compress: bool = True,
) -> dict:
    """
    Compress and upload an image to Cloudinary.
    
    Args:
        file_bytes: Raw image bytes
        filename: Optional custom filename
        folder: Cloudinary folder
        compress: Whether to compress before uploading
    
    Returns:
        Dict with 'url' (secure_url) and 'public_id'
    """
    if not filename:
        filename = f"img_{uuid.uuid4().hex[:12]}"

    if compress:
        buffer = compress_image(file_bytes)
    else:
        buffer = io.BytesIO(file_bytes)

    try:
        result = cloudinary.uploader.upload(
            buffer,
            folder=folder,
            public_id=filename,
            resource_type="image",
            overwrite=True,
        )
        return {
            "url": result["secure_url"],
            "public_id": result["public_id"],
        }
    except Exception as e:
        raise Exception(f"Cloudinary upload failed: {str(e)}")


def delete_from_cloudinary(public_id: str) -> bool:
    """Delete an image from Cloudinary by its public_id."""
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except Exception:
        return False
