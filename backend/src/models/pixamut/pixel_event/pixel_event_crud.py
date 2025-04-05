from typing import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


from src.models.base.base_crud import CRUDBase
from .pixel_event_model import PixelEventModel
from .pixel_event_schema import PixelEventCreate, PixelEventUpdate


class CRUDPixels(CRUDBase[PixelEventModel, PixelEventCreate, PixelEventUpdate]):
    async def get_many_of_pixel(
        self, db: AsyncSession, *, pixel_id: int, skip: int = 0, limit: int = 100
    ) -> Sequence[PixelEventModel]:
        res = await db.execute(
            select(self.model)
            .where(
                (self.model.deleted_at.is_(None)) & (self.model.pixel_id == pixel_id)
            )
            .offset(skip)
            .limit(limit)
        )
        return res.scalars().all()

    pass


PIXEL_EVENTS = CRUDPixels(PixelEventModel)
