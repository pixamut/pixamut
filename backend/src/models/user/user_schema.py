from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserOAuth(BaseModel):
    username: str = Field(max_length=255)
    email: EmailStr = Field(max_length=255)
    picture: str | None = None
    google_id: str | None = None
    github_id: str | None = None
    wallet: str | None = None
    joined_pixamut_at: datetime | None = None


class UserBase(UserOAuth):
    pass


# Properties to receive on item creation
class UserCreate(UserBase):
    password: str | None = None
    pass


# Properties to receive on item update
class UserUpdate(UserCreate):
    oldest_accepted_token_time: int | None = None
    pass


# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    tech_id: int

    class Config:
        from_attributes = True


# Properties properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str

    updated_at: datetime
    created_at: datetime
    deleted_at: datetime


# Properties to return to client
class User(UserInDBBase):
    pass
