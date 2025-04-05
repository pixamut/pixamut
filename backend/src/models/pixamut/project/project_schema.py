from datetime import datetime
from pydantic import BaseModel


class ProjectMetadata(BaseModel):
    address: str
    balance: int = 0
    gas_used: int = 0
    gas_available: int = 0
    best_row: int | None = None
    best_col: int | None = None
    best_cost: int | None = None


class Project(BaseModel):
    address: str
    title: str
    image: str
    image_h: int
    image_w: int
    nbr_active_pixels: int
    creator: str
    balance: int = 0
    gas_used: int = 0
    gas_available: int = 0
    best_row: int | None = None
    best_col: int | None = None
    best_cost: int | None = None


class ProjectBase(BaseModel):
    address: str
    title: str
    image: str
    image_grid: bytes
    image_mask: bytes
    image_h: int
    image_w: int
    nbr_active_pixels: int
    creator: str
    balance: int = 0
    gas_used: int = 0
    gas_available: int = 0
    best_row: int | None = None
    best_col: int | None = None
    best_cost: int | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    address: str
    best_x: int
    best_y: int
    best_cost: int


class ProjectInDBBase(ProjectBase):
    updated_at: datetime
    created_at: datetime
    deleted_at: datetime | None

    class Config:
        from_attributes = True


class ProjectInDB(ProjectCreate):
    class Config:
        from_attributes = False
