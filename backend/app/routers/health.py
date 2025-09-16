"""Health check and readiness probe routes."""
from fastapi import APIRouter, status

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/", status_code=status.HTTP_200_OK)
async def health_check() -> dict[str, str]:
    """Return simple OK payload for liveness/readiness probes."""
    return {"status": "ok"}
