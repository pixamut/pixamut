from typing import Any, Sequence

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.future import select
from sqlalchemy import update

from sqlalchemy.ext.asyncio import AsyncSession

from src.models.base.base_crud import CRUDBase
from .key_value_model import KeyValueModel
from .key_value_schema import KeyValue


class CRUDKeyValue(CRUDBase[KeyValueModel, KeyValue, KeyValue]):
    async def get(self, db: AsyncSession, *, key: str) -> KeyValueModel | None:
        res = await db.execute(select(self.model).where(self.model.key == key))
        return res.scalar_one_or_none()

    async def set(self, db: AsyncSession, *, key: str, value: str) -> KeyValueModel:
        res = await self.create(db, obj_in=KeyValue(key=key, value=value))
        return res


KEYVALUE = CRUDKeyValue(KeyValueModel)
