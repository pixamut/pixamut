from datetime import datetime
from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    email: str
    tech_id: int
    expire_at: datetime


class TokenPayload(BaseModel):
    sub: str | None = None
    exp: datetime
