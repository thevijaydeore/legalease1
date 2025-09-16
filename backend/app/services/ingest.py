"""Ingestion pipeline: parse files, chunk, embed, and persist to Supabase/pgvector.

This is a placeholder implementation. It returns counts and stubs while we wire
up parsing and embeddings in the next iteration.
"""
from typing import Tuple


async def ingest_file(filename: str, content: bytes) -> Tuple[str, int, list[str]]:
    """Stub ingestion that pretends to index a document.

    Returns: (document_id, chunks_indexed, warnings)
    """
    # TODO: implement
    warnings: list[str] = [
        "ingest_file is not implemented yet: no chunks stored, no embeddings created",
    ]
    return ("stub-doc-id", 0, warnings)
