from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, update, func

from src.models.base.base_crud import CRUDBase
from .action_model import ActionModel
from .action_schema import ActionCreate, ActionUpdate, ActionCall, ActionMethod


class CRUDActions(CRUDBase[ActionModel, ActionCreate, ActionUpdate]):
    async def setActions(
        self, db: AsyncSession, *, project_address: str, actions: list[ActionCreate]
    ) -> list[ActionModel]:
        await db.execute(
            update(self.model)
            .where(
                (self.model.address == project_address)
                & (self.model.deleted_at == None)
            )
            .values(deleted_at=func.now())
        )

        dbActions: list[ActionModel] = []
        for action in actions:
            dbAction = await self.create(db, obj_in=action)
            dbActions.append(dbAction)
        return dbActions


ACTIONS = CRUDActions(ActionModel)
