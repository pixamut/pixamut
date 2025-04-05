from datetime import timedelta
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession

from src.api import deps
from src.core.config import config
from src.core.email import send_new_account_email
from src.core.security import create_access_token, create_refresh_token
from src.models.user.user_crud import USERS, UserModel, UserCreate, UserUpdate, User
from src.models.token_schema import Token

router = APIRouter()


@router.get("/username/{username}")
async def username_exists(
    *, db: AsyncSession = Depends(deps.get_db), username: str
) -> Any:
    user = await USERS.get_by_username(db, username=username)
    return user is not None


@router.get("/email/{email}")
async def email_exists(*, db: AsyncSession = Depends(deps.get_db), email: str) -> Any:
    user = await USERS.get_by_email(db, email=email)
    return user is not None


@router.post("/{project}", response_model=Token)
async def create_user(
    response: Response,
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    project: str,
) -> Any:
    user = await USERS.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400, detail="User with this email already exists"
        )
    user = await USERS.create(db, obj_in=user_in)
    print("USER ID: ", user.tech_id)
    await USERS.init_user_for_project_if_needed(db, user=user, project=project)
    send_new_account_email(
        background_tasks, email_to=user_in.email, username=user_in.username
    )

    new_refresh_token = create_refresh_token(str(user.tech_id))
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        path=f"{config.API_PREFIX}/cookie",
        max_age=config.REFRESH_TOKEN_EXPIRE_MINUTES,
    )
    access_token, expire_at = create_access_token(str(user.tech_id))
    return Token(
        access_token=access_token,
        token_type="Bearer",
        username=user.username,
        email=user.email,
        tech_id=user.tech_id,
        expire_at=expire_at,
    )


@router.put("/me", response_model=User)
async def update_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: UserModel = Depends(deps.get_current_user),
) -> Any:
    current_user_data = jsonable_encoder(current_user)
    user = UserUpdate(**current_user_data)
    if user_in.password is not None:
        user.password = user_in.password
    if user_in.username is not None:
        user.username = user_in.username
    if user_in.email is not None:
        user.email = user_in.email
    u = await USERS.update(db, db_obj=current_user, obj_in=user)
    return u
