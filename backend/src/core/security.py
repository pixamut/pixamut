from typing import Tuple
from datetime import UTC, datetime, timedelta

import bcrypt
from jose import JWTError, jwt

from app.schemas.token import TokenPayload

from .config import config

ALGORITHM = "HS256"


def create_access_token(
    subject: int, expires_delta: timedelta | None = None
) -> Tuple[str, datetime]:
    if expires_delta:
        expire = datetime.now(tz=UTC) + expires_delta
    else:
        expire = datetime.now(tz=UTC) + timedelta(
            minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = TokenPayload(exp=expire, sub=subject)
    encoded_jwt = jwt.encode(to_encode.dict(), config.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, expire


def create_refresh_token(subject: int, expires_delta: timedelta | None = None) -> str:
    if expires_delta:
        expire = datetime.now(tz=UTC) + expires_delta
    else:
        expire = datetime.now(tz=UTC) + timedelta(
            minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = TokenPayload(exp=expire, sub=subject)
    encoded_jwt = jwt.encode(
        to_encode.dict(), config.REFRESH_SECRET_KEY, algorithm=ALGORITHM
    )
    return encoded_jwt


def verify_access_token(token: str) -> TokenPayload | None:
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[ALGORITHM])
        return TokenPayload(**payload) if payload is not None else None
    except JWTError:
        return None


def verify_refresh_token(token: str) -> TokenPayload | None:
    try:
        payload = jwt.decode(token, config.REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        return TokenPayload(**payload) if payload is not None else None
    except JWTError:
        return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        password=plain_password.encode("utf8"),
        hashed_password=hashed_password.encode("utf8"),
    )


def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf8")
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password=pwd_bytes, salt=salt)
    return hashed_password.decode("utf8")


def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=config.EMAIL_RESET_TOKEN_EXPIRE_MINUTES)
    now = datetime.now(tz=UTC)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nfb": now, "sub": email}, config.SECRET_KEY, algorithm=ALGORITHM
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> str | None:
    try:
        decoded_token = jwt.decode(token, config.SECRET_KEY, algorithms=[ALGORITHM])
        return decoded_token["email"]
    except JWTError:
        return None
