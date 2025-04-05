from fastapi import APIRouter
from . import pixels, pixel_events, projects, chat

router = APIRouter()

router.include_router(pixels.router, prefix="/pixels", tags=["pixels"])
router.include_router(pixel_events.router, prefix="/pixelEvents", tags=["pixelEvents"])
router.include_router(projects.router, prefix="/projects", tags=["projects"])
router.include_router(chat.router, prefix="/chat", tags=["chat"])
