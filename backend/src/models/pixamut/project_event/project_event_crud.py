from typing import Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select


from src.models.base.base_crud import CRUDBase
from .project_event_model import ProjectEventModel
from .project_event_schema import ProjectEventCreate, ProjectEventUpdate


class CRUDProjects(CRUDBase[ProjectEventModel, ProjectEventCreate, ProjectEventUpdate]):
    async def get_many_of_project(
        self, db: AsyncSession, *, project_address: str, skip: int = 0, limit: int = 100
    ) -> Sequence[ProjectEventModel]:
        res = await db.execute(
            select(self.model)
            .where(
                (self.model.deleted_at.is_(None))
                & (self.model.project_address == project_address)
            )
            .offset(skip)
            .limit(limit)
        )
        return res.scalars().all()


PROJECT_EVENTS = CRUDProjects(ProjectEventModel)
