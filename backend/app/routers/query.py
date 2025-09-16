"""Query endpoint for RAG pipeline."""
from fastapi import APIRouter, HTTPException, status

from ..models.query import QueryRequest, QueryResponse
from ..services.rag import answer_query

router = APIRouter(prefix="/query", tags=["Query"])


@router.post("/", response_model=QueryResponse, status_code=status.HTTP_200_OK)
async def run_query(payload: QueryRequest) -> QueryResponse:
    if not payload.query or len(payload.query.strip()) < 2:
        raise HTTPException(status_code=400, detail="Query too short")

    # Delegate to the RAG service (currently a stub)
    return await answer_query(payload)
