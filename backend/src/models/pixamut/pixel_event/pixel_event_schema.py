from pydantic import BaseModel
from datetime import datetime


class PixelEventBase(BaseModel):
    log_index: int
    hash: str
    pixel_id: int
    stake_amount: int
    color: int
    owner: str
    timestamp: datetime


class PixelEventCreate(PixelEventBase):
    pass


class PixelEventUpdate(PixelEventCreate):
    pass


class PixelEventInDBBase(PixelEventBase):
    updated_at: datetime
    created_at: datetime
    deleted_at: datetime | None


class PixelEventInDB(PixelEventCreate):
    class Config:
        from_attributes = True
