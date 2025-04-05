from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from sqlalchemy.future import select

from src.models.base.base_crud import CRUDBase
from .project_model import ProjectModel
from .project_schema import ProjectCreate, ProjectUpdate


class CRUDProjects(CRUDBase[ProjectModel, ProjectCreate, ProjectUpdate]):
    async def get(
        self, db: AsyncSession, *, project_address: str
    ) -> ProjectModel | None:
        res = await db.execute(
            select(self.model).where(
                (self.model.deleted_at.is_(None))
                & (self.model.address == project_address)
            )
        )
        return res.scalar_one_or_none()

    async def get_metadata(
        self, db: AsyncSession, *, project_address: str
    ) -> ProjectModel | None:
        res = await db.execute(
            select(
                self.model.address,
                self.model.balance,
                self.model.best_col,
                self.model.best_row,
                self.model.gas_used,
                self.model.gas_available,
                self.model.best_cost,
            ).where(
                (self.model.deleted_at.is_(None))
                & (self.model.address == project_address)
            )
        )
        return res.scalar_one_or_none()

    async def update_balance(
        self, db: AsyncSession, *, project_address: str, amount: int
    ) -> None:
        res_balance = await db.execute(
            select(self.model.balance).where(self.model.address == project_address)
        )
        balance = res_balance.scalar()
        if balance is None:
            balance = 0
        await db.execute(
            update(self.model)
            .where(self.model.address == project_address)
            .values(balance=balance + amount)
        )
        await db.commit()

    # async def get_minimal(self, db: AsyncSession, *, project_address: str) -> ProjectModel | None:
    #     res = await db.execute(
    #         select(self.model.address, self.model.best_x, self.model.best_y, self.model.balance, self.model.used, self.model.best_cost)
    #         .where((self.model.deleted_at.is_not(None)) & (self.model.address == project_address))
    #     )
    #     return res.scalar_one_or_none()


PROJECTS = CRUDProjects(ProjectModel)
