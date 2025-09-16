"""Chunking utilities for document text."""
from typing import List


def chunk_text(text: str, max_chars: int = 1200, overlap: int = 200) -> List[str]:
    """Naive character-based chunking with overlap.

    Args:
        text: full text to chunk
        max_chars: maximum characters per chunk
        overlap: number of overlapping characters between consecutive chunks
    """
    if max_chars <= 0:
        return [text]

    chunks: List[str] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + max_chars, n)
        chunks.append(text[start:end])
        if end == n:
            break
        start = end - overlap if overlap > 0 else end
    return chunks
