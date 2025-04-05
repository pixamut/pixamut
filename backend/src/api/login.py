from typing import Any
from datetime import timedelta

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Body,
    Depends,
    HTTPException,
    Response,
    Request,
    status,
)
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.background import BackgroundTask
from authlib.integrations.starlette_client import OAuth

from src.api import deps
from src.core.config import config
from src.core.security import (
    create_access_token,
    create_refresh_token,
    generate_password_reset_token,
    get_password_hash,
    verify_password_reset_token,
    verify_access_token,
    verify_refresh_token,
)
from src.models.user.user_crud import USERS, UserModel
from src.models.token_schema import Token
from src.models.message import Message
from src.core.email import send_reset_password_email

router = APIRouter()
oauth = OAuth()

# oauth.register(
#     name='google',
#     client_id=settings.GOOGLE_CLIENT_ID,
#     client_secret=settings.GOOGLE_CLIENT_SECRET,
#     server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
#     client_kwargs={'scope': 'openid email profile'},
# )

# oauth.register(
#     name='github',
#     client_id=settings.GITHUB_CLIENT_ID,
#     client_secret=settings.GITHUB_CLIENT_SECRET,
#     authorize_url='https://github.com/login/oauth/authorize',
#     access_token_url='https://github.com/login/oauth/access_token',
#     client_kwargs={'scope': 'user:email'}
# )


@router.post("/cookie/refresh", response_model=Token)
async def refresh_token(
    request: Request, response: Response, *, db: AsyncSession = Depends(deps.get_db)
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="no refresh token provided"
        )
    payload = verify_refresh_token(refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid refresh token"
        )

    user_id = int(payload.sub) if payload.sub is not None else -1
    user = await USERS.get_by_id(db, tech_id=user_id)
    if not user:
        raise HTTPException(status_code=403, detail="Invalid refresh token")

    if user.oldest_accepted_token_time and user.oldest_accepted_token_time > (
        payload.exp - timedelta(minutes=config.REFRESH_TOKEN_EXPIRE_MINUTES)
    ):
        raise HTTPException(status_code=403, detail="Invalid refresh token")

    new_access_token, expire_at = create_access_token(str(user.tech_id))
    return Token(
        access_token=new_access_token,
        token_type="Bearer",
        username=user.username,
        email=user.email,
        tech_id=user.tech_id,
        expire_at=expire_at,
    )


@router.get("/cookie/logout")
async def logout(response: Response):
    response.delete_cookie("refresh_token")


@router.post("/login/password/{project}", response_model=Token)
async def login_access_token(
    response: Response,
    *,
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
    project: str,
) -> Any:
    user = await USERS.authenticateWithPassword(
        db,
        username_or_email=form_data.username,
        password=form_data.password,
        project=project,
    )
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials") from None

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


@router.get("/login/google/{project}")
async def login_google_access_token(project: str) -> Any:
    redirect_uri = (
        f"{config.BACKEND_BASE_URL}{config.API_PREFIX}/login/google-callback/{project}"
    )
    provider = oauth.create_client("google")
    if not provider:
        raise HTTPException(
            status_code=500, detail="Google OAuth provider not configured"
        )
    return await provider.authorize_redirect(redirect_uri)


@router.get("/login/google-callback/{project}")
async def login_google_callback(
    *, db: AsyncSession = Depends(deps.get_db), project: str
) -> Any:
    provider = oauth.create_client("google")
    if not provider:
        raise HTTPException(
            status_code=500, detail="Google OAuth provider not configured"
        )
    token = await provider.authorize_access_token()
    user_info = token["userinfo"]
    email = user_info.get("email")
    google_id = user_info.get("sub")
    picture = user_info.get("picture")

    if not email:
        raise HTTPException(status_code=400, detail="No email provided")
    user = await USERS.authenticateWithOAuth(
        db, email=email, google_id=google_id, picture=picture, project=project
    )
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials") from None

    access_token, expire_at = create_access_token(str(user.tech_id))
    return Token(
        access_token=access_token,
        token_type="Bearer",
        username=user.username,
        email=user.email,
        tech_id=user.tech_id,
        expire_at=expire_at,
    )


@router.get("/login/github/{project}")
async def login_github_access_token(project: str) -> Any:
    redirect_uri = (
        f"{config.BACKEND_BASE_URL}{config.API_PREFIX}/login/github-callback/{project}"
    )
    provider = oauth.create_client("github")
    if not provider:
        raise HTTPException(
            status_code=500, detail="Github OAuth provider not configured"
        )
    return await provider.authorize_redirect(redirect_uri)


@router.get("/login/github-callback/{project}")
async def login_github_callback(
    *, db: AsyncSession = Depends(deps.get_db), project: str
) -> Any:
    provider = oauth.create_client("github")
    if not provider:
        raise HTTPException(
            status_code=500, detail="Github OAuth provider not configured"
        )
    token = await provider.authorize_access_token()
    user_response = await provider.get("user", token=token)
    user_info = user_response.json()
    github_id = set(user_info.get("id"))
    username = user_info.get("name")
    github_id = user_info.get("sub")
    picture = user_info.get("avatar_url")

    email_response = await provider.get("user/emails", token=token)
    email_info = email_response.json()
    email = next((email["email"] for email in email_info if email["primary"]), None)

    if not email:
        raise HTTPException(status_code=400, detail="No email provided")
    user = await USERS.authenticateWithOAuth(
        db,
        email=email,
        google_id=github_id,
        picture=picture,
        username=username,
        project=project,
    )
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials") from None

    access_token, expire_at = create_access_token(str(user.tech_id))
    return Token(
        access_token=access_token,
        token_type="Bearer",
        username=user.username,
        email=user.email,
        tech_id=user.tech_id,
        expire_at=expire_at,
    )


@router.post("/password-recovery/{email}", response_model=Message)
async def recover_password(
    background_tasks: BackgroundTasks,
    email: str,
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    user = await USERS.get_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found") from None
    password_reset_token = generate_password_reset_token(email=email)
    send_reset_password_email(
        background_tasks, email_to=user.email, token=password_reset_token
    )
    return {"message": "Password recovery email sent"}


@router.post("/reset-password", response_model=Message)
async def reset_password(
    token: str = Body(...),
    new_password: str = Body(...),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    email = verify_password_reset_token(token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token") from None
    user = await USERS.get_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    elif not USERS.is_active(user):
        raise HTTPException(status_code=400, detail="Inactive user")
    hashed_password = get_password_hash(new_password)
    user.hashed_password = hashed_password
    db.add(user)
    await db.commit()
    return {"message": "Password updated successfully"}
