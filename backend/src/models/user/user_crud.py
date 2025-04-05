from typing import Any
import re
from random import randint
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.core.security import get_password_hash, verify_password
from .user_model import UserModel
from .user_schema import UserCreate, UserUpdate
from src.models.pixamut.init import init_pixamut_for_user

from src.models.base.base_crud import CRUDBase


def is_default_username(username: str) -> bool:
    pattern = r"^user_\d+$"
    return bool(re.match(pattern, username))


def gen_default_username() -> str:
    return f"user_{randint(1000, 900_000)}"


class CRUDUser(CRUDBase[UserModel, UserCreate, UserUpdate]):
    async def get_by_id(
        self, db: AsyncSession, *, tech_id: int | None
    ) -> UserModel | None:
        res = await db.execute(select(self.model).filter(UserModel.tech_id == tech_id))
        return res.scalar_one_or_none()

    async def get_by_email(self, db: AsyncSession, *, email: str) -> UserModel | None:
        res = await db.execute(select(self.model).filter(UserModel.email == email))
        return res.scalar_one_or_none()

    async def get_by_username(
        self, db: AsyncSession, *, username: str
    ) -> UserModel | None:
        res = await db.execute(
            select(self.model).filter(UserModel.username == username)
        )
        return res.scalar_one_or_none()

    async def get_by_username_or_email(
        self, db: AsyncSession, *, username_email: str
    ) -> UserModel | None:
        res = await db.execute(
            select(self.model).filter(
                (UserModel.username == username_email)
                | (UserModel.email == username_email)
            )
        )
        return res.scalar_one_or_none()

    async def create(self, db: AsyncSession, *, obj_in: UserCreate) -> UserModel:
        if obj_in.password:
            hashed_password = get_password_hash(obj_in.password)
        else:
            hashed_password = None

        db_obj = UserModel(
            email=obj_in.email.lower(),
            hashed_password=hashed_password,
            username=obj_in.username,
            is_active=True,
            picture=obj_in.picture,
            google_id=obj_in.google_id,
            github_id=obj_in.github_id,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)

        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: UserModel,
        obj_in: UserUpdate | dict[str, Any] | UserCreate,
    ) -> UserModel:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        if update_data["password"]:
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        if update_data["username"]:
            username = update_data["username"].lower()
            if is_default_username(username):
                del update_data["username"]
            else:
                update_data["username"] = username
        if update_data["email"]:
            update_data["email"] = update_data["email"].lower()
        if update_data["google_id"] is None:
            del update_data["google_id"]
        if update_data["github_id"] is None:
            del update_data["github_id"]
        if update_data["picture"] is None:
            del update_data["picture"]

        return await super().update(db, db_obj=db_obj, obj_in=update_data)

    async def authenticateWithOAuth(
        self,
        db: AsyncSession,
        *,
        email: str,
        google_id: str | None = None,
        github_id: str | None = None,
        picture: str | None = None,
        username: str | None = None,
        project: str,
    ) -> UserModel | None:
        user = await self.get_by_email(db, email=email)
        default_username = username if username is not None else gen_default_username()
        obj_in = UserUpdate(
            email=email,
            google_id=google_id,
            github_id=github_id,
            picture=picture,
            username=default_username,
        )

        if not user:
            user = await self.create(db, obj_in=obj_in)
        else:
            user = await self.update(db, obj_in=obj_in, db_obj=user)

        await self.init_user_for_project_if_needed(db, user, project)

        return user

    async def authenticateWithPassword(
        self, db: AsyncSession, *, username_or_email: str, password: str, project: str
    ) -> UserModel | None:
        user = await self.get_by_username_or_email(
            db, username_email=username_or_email.lower()
        )

        if not user:
            return None
        elif user.hashed_password is None:
            return None
        elif not verify_password(password, user.hashed_password):
            return None
        else:
            await self.init_user_for_project_if_needed(db, user, project)
            return user

    def is_active(self, user: UserModel) -> bool:
        return user.is_active == True

    async def init_user_for_project_if_needed(
        self, db: AsyncSession, user: UserModel, project: str
    ):
        if project == "stakeifys" and user.joined_pixamut_at is None:
            user.joined_pixamut_at = datetime.utcnow()
            await init_pixamut_for_user(db, user.tech_id)
            db.add(user)
            await db.commit()


USERS = CRUDUser(UserModel)
