from collections.abc import Generator
from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from src.core import security
from src.core.config import config
from src.models.user.user_crud import USERS, UserModel
from src.models.session import async_session
from src.models.token_schema import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl=f"{config.API_PREFIX}/login/password")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


async def get_current_user_id(token: str = Depends(reusable_oauth2)) -> int:
    try:
        token_data = security.verify_access_token(token)

        if token_data is None or token_data.sub is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            ) from None
    except Exception:
        # print(getattr(e, "message", repr(e)))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        ) from None

    return int(token_data.sub)


async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> UserModel:
    user_id = await get_current_user_id(token)
    user = await USERS.get_by_id(db, tech_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    return user
