from pydantic import BaseModel
from datetime import datetime


class ProjectEventBase(BaseModel):
    log_index: int
    hash: str
    project_address: str
    amount: int
    gas: int = 0
    user: str
    timestamp: datetime


class ProjectEventCreate(ProjectEventBase):
    pass


class ProjectEventUpdate(ProjectEventCreate):
    pass


class ProjectEventInDBBase(ProjectEventBase):
    updated_at: datetime
    created_at: datetime
    deleted_at: datetime | None


class ProjectEventInDB(ProjectEventCreate):
    class Config:
        from_attributes = True
