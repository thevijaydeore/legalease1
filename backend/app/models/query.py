from pydantic import BaseModel, Field
from typing import List, Optional


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=2)
    top_k: int = Field(default=5, ge=1, le=20)
    user_id: Optional[str] = None


class SourceChunk(BaseModel):
    document_id: str
    chunk_id: str
    text: str
    score: float
    filename: Optional[str] = None


class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceChunk] = []
