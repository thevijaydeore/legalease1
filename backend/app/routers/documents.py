"""Document upload endpoints.

This defines a minimal upload route. In the next steps, we'll wire it to services.ingest
for chunking, embedding, and persisting to Supabase/pgvector.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from typing import Optional

from ..models.document import UploadResponse

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_200_OK)
async def upload_document(
    file: UploadFile = File(..., description="PDF, DOCX or TXT file"),
    user_id: Optional[str] = None,
):
    # Basic validation
    if file.size is not None and file.size <= 0:
        raise HTTPException(status_code=400, detail="Empty file")

    # TODO: call services.ingest.ingest_file(...)
    # For now, return a stub response so the frontend can integrate with the API shape
    return UploadResponse(
        document_id="stub-doc-id",
        chunks_indexed=0,
        message=f"received {file.filename}",
        warnings=["ingestion pipeline not wired yet"],
    )
