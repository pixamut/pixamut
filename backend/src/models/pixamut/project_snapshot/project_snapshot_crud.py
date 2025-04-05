from typing import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update, func
from sqlalchemy.future import select

from src.models.base.base_crud import CRUDBase
from .project_snapshot_schema import (
    ProjectSnapshot,
    ProjectSnapshotCreate,
    ProjectSnapshotUpdate,
)
from .project_snapshot_model import ProjectSnapshotModel


class CRUDProjectSnapshots(
    CRUDBase[ProjectSnapshotModel, ProjectSnapshotCreate, ProjectSnapshotUpdate]
):
    async def get(
        self, db: AsyncSession, *, project_address: str
    ) -> ProjectSnapshotModel | None:
        res = await db.execute(
            select(self.model)
            .where(
                (self.model.deleted_at.is_(None))
                & (self.model.address == project_address)
            )
            .order_by(self.model.created_at.desc())
            .limit(1)
        )
        return res.scalar_one_or_none()

    async def get_recent(
        self, db: AsyncSession, *, limit: int = 5
    ) -> Sequence[ProjectSnapshotModel]:
        # Assuming your model has a primary key called 'id'
        subq = select(
            ProjectSnapshotModel.created_at,
            func.row_number()
            .over(
                partition_by=ProjectSnapshotModel.address,
                order_by=ProjectSnapshotModel.created_at.desc(),
            )
            .label("row_num"),
        ).subquery()

        stmt = (
            select(ProjectSnapshotModel)
            .join(subq, subq.c.created_at == ProjectSnapshotModel.created_at)
            .where(subq.c.row_num <= limit)
        )
        result = await db.execute(stmt)
        return result.scalars().all()


PROJECT_SNAPSHOTS = CRUDProjectSnapshots(ProjectSnapshotModel)
