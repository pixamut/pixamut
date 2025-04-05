from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends

from app.api.deps import get_db
from app.schemas.stakeifys.pixel_event import PixelEventInDB
from app.crud.stakeifys.crud_pixel_events import PIXEL_EVENTS

router = APIRouter()


@router.get("/{pixel_id}", response_model=list[PixelEventInDB])
async def read_pixel_events(pixel_id: int, db: AsyncSession = Depends(get_db)) -> Any:
    pixel_events = await PIXEL_EVENTS.get_many_of_pixel(db, pixel_id=pixel_id)
    return pixel_events
