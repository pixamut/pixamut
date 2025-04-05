from datetime import datetime
from pydantic import BaseModel


class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    pass


class CommentUpdate(BaseModel):
    content: str


class CommentInDBBase(CommentBase):
    updated_at: datetime
    created_at: datetime
    deleted_at: datetime | None

    class Config:
        from_attributes = True


class CommentInDB(CommentCreate):
    class Config:
        from_attributes = False
