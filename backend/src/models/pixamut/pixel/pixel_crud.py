from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from src.models.base.base_crud import CRUDBase
from .pixel_model import PixelModel
from .pixel_schema import PixelCreate, PixelUpdate, PixelBase, PixelInDB


class CRUDPixels(CRUDBase[PixelModel, PixelCreate, PixelUpdate]):
    async def get(self, db: AsyncSession, *, pixel_id: int) -> PixelModel | None:
        res = await db.execute(select(self.model).where(self.model.id == pixel_id))
        return res.scalar_one_or_none()

    async def get_owner_pixel_count(self, db: AsyncSession, owner: str) -> int:
        res = await db.execute(
            select(func.count())
            .select_from(self.model)
            .where(self.model.owner == owner.lower())
        )
        return res.scalar_one()


PIXELS = CRUDPixels(PixelModel)
