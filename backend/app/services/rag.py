"""RAG service entry points."""
from ..models.query import QueryRequest, QueryResponse, SourceChunk


async def answer_query(payload: QueryRequest) -> QueryResponse:
    """Temporary stub answer to allow frontend integration.

    In the next step, this will:
    - run similarity search in pgvector to get top_k chunks
    - construct a prompt and call the LLM
    - return structured sources and answer
    """
    # Stub sources
    sources = [
        SourceChunk(
            document_id="stub-doc-id",
            chunk_id="chunk-1",
            text="This is a placeholder context chunk.",
            score=0.0,
            filename="placeholder.txt",
        )
    ]
    return QueryResponse(answer=f"Stub answer to: {payload.query}", sources=sources)
