from datetime import datetime
from pydantic import BaseModel

from enum import Enum


class ActionMethod(Enum):
    stakePixels = "stakePixels"
    changeColors = "changeColors"
    unstakePixels = "unstakePixels"


class ActionCall(BaseModel):
    method: ActionMethod
    pixelIds: list[int]
    amounts: list[int] | None = None
    colors: list[int] | None = None

    class Config:
        use_enum_values = True


class ActionBase(BaseModel):
    address: str
    idx: int
    call: ActionCall
    hash: str
    gas_used: int = 0


class ActionCreate(ActionBase):
    pass


class ActionUpdate(ActionCreate):
    pass


class ActionInDBBase(ActionBase):
    updated_at: datetime
    created_at: datetime
    deleted_at: datetime | None

    class Config:
        from_attributes = True


class ActionInDB(ActionCreate):
    class Config:
        from_attributes = False
