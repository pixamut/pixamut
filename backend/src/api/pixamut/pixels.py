from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends

from app.api.deps import get_db
from app.schemas.stakeifys.pixel import PixelInDB
from app.crud.stakeifys.crud_pixels import PIXELS

router = APIRouter()


@router.get("/", response_model=list[PixelInDB])
async def read_pixels(db: AsyncSession = Depends(get_db)) -> Any:
    pixels = await PIXELS.get_many(db)
    return pixels
