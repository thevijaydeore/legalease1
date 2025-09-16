"""FastAPI application entry-point for LegalEase backend."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import health  # noqa: E402  (import after FastAPI packages is fine)
from .routers import documents, query

app = FastAPI(title="LegalEase Backend", version="0.1.0")

# Allow the Vite dev server and production front-end to reach the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(documents.router)
app.include_router(query.router)


@app.get("/")
def root() -> dict[str, str]:
    """Root endpoint used mainly for quick smoke tests."""
    return {"status": "ok", "message": "LegalEase backend is running"}
