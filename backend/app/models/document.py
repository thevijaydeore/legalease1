from pydantic import BaseModel, Field
from typing import Optional, List


class DocumentMetadata(BaseModel):
    id: str
    filename: str
    content_type: Optional[str] = None
    size_bytes: Optional[int] = None
    user_id: Optional[str] = Field(default=None, description="Supabase auth user id")


class UploadResponse(BaseModel):
    document_id: str
    chunks_indexed: int = 0
    message: str = "uploaded"
    warnings: List[str] = []
