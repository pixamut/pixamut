from datetime import datetime
from pydantic import BaseModel


class ProjectSnapshot(BaseModel):
    address: str
    title: str
    nbr_active_pixels: int
    nbr_controlled_pixels: int
    balance: int = 0
    gas_used: int = 0
    gas_available: int = 0
    best_row: int | None = None
    best_col: int | None = None
    best_cost: int | None = None


class ProjectSnapshotBase(BaseModel):
    address: str
    title: str
    nbr_active_pixels: int
    nbr_controlled_pixels: int
    balance: int = 0
    gas_used: int = 0
    gas_available: int = 0
    best_row: int | None = None
    best_col: int | None = None
    best_cost: int | None = None


class ProjectSnapshotCreate(ProjectSnapshotBase):
    pass


class ProjectSnapshotUpdate(BaseModel):
    address: str
    best_x: int
    best_y: int
    best_cost: int


class ProjectSnapshotInDBBase(ProjectSnapshotBase):
    updated_at: datetime
    created_at: datetime
    deleted_at: datetime | None

    class Config:
        from_attributes = True


class ProjectSnapshotInDB(ProjectSnapshotCreate):
    class Config:
        from_attributes = False
