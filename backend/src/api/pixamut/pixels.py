from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends

from src.api.deps import get_db
from src.models.pixamut.pixel.pixel_crud import PIXELS, PixelInDB

router = APIRouter()


@router.get("/", response_model=list[PixelInDB])
async def read_pixels(db: AsyncSession = Depends(get_db)) -> Any:
    pixels = await PIXELS.get_many(db)
    return pixels
