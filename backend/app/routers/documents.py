"""Document upload endpoints.

This defines a minimal upload route. In the next steps, we'll wire it to services.ingest
for chunking, embedding, and persisting to Supabase/pgvector.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from typing import Optional, List
import uuid

from ..models.document import UploadResponse
from ..db.supabase_client import get_supabase

GUEST_USER_ID = "00000000-0000-0000-0000-000000000001"

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_200_OK)
async def upload_document(
    file: UploadFile = File(..., description="PDF, DOCX or TXT file"),
    user_id: Optional[str] = None,
):
    # Basic validation
    if file.size is not None and file.size <= 0:
        raise HTTPException(status_code=400, detail="Empty file")

    allowed_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
    }
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {file.content_type}")

    # Read bytes
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    warnings: List[str] = []

    # Upload to Supabase Storage
    sb = get_supabase()
    bucket = "documents"
    effective_user_id = user_id or GUEST_USER_ID
    path = f"{effective_user_id}/{uuid.uuid4().hex}-{file.filename}"
    try:
        sb.storage.from_(bucket).upload(
            path=path,
            file=content,
            file_options={
                "contentType": file.content_type or "application/octet-stream",
                "upsert": False,
            },
        )
    except Exception as e:  # noqa: BLE001 broad catch to return helpful API error
        raise HTTPException(status_code=502, detail=f"Storage upload failed: {e}") from e

    # Insert metadata row into Supabase Postgres (optional if table exists)
    document_id: str = path
    try:
        insert_payload = {
            "title": file.filename or "Untitled Document",  # Required field
            "original_filename": file.filename,  # Required field
            "file_path": path,  # Correct column name
            "file_type": file.content_type,  # Correct column name
            "file_size": len(content),  # Correct column name
            "user_id": effective_user_id,
        }
        res = sb.table("documents").insert(insert_payload).select("id").single().execute()
        if getattr(res, "data", None) and isinstance(res.data, dict) and res.data.get("id"):
            document_id = str(res.data["id"])  # prefer DB-generated id if available
        else:
            warnings.append("DB insert did not return an id; using storage path as document_id")
    except Exception as e:  # table may not exist yet; don't fail upload
        warnings.append(f"DB insert failed: {e}")

    return UploadResponse(
        document_id=document_id,
        chunks_indexed=0,
        message=f"uploaded {file.filename}",
        warnings=warnings,
    )
