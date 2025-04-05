from datetime import datetime
from pydantic import BaseModel


class PixelBase(BaseModel):
    id: int
    color: int
    stake_amount: int
    owner: str


class PixelCreate(PixelBase):
    pass


class PixelUpdate(PixelCreate):
    hash: str | None
    pass


class PixelInDBBase(PixelBase):
    updated_at: datetime
    created_at: datetime
    deleted_at: datetime | None

    class Config:
        from_attributes = True


class PixelInDB(PixelCreate):
    class Config:
        from_attributes = False
