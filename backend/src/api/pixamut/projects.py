from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends

from src.api.deps import get_db
from app.crud.stakeifys.crud_projects import PROJECTS
from app.schemas.stakeifys.project import Project, ProjectMetadata

router = APIRouter()


@router.get("/", response_model=list[Project])
async def read_pixels(db: AsyncSession = Depends(get_db)) -> Any:
    projects = await PROJECTS.get_many(db)
    return projects


@router.get("/metadata/{address}", response_model=ProjectMetadata | None)
async def get_project_metadata_from_address(
    address: str, db: AsyncSession = Depends(get_db)
) -> Any:
    project = await PROJECTS.get(db, project_address=address.lower())
    return project


@router.get("/{address}", response_model=Project | None)
async def get_project_from_address(
    address: str, db: AsyncSession = Depends(get_db)
) -> Any:
    project = await PROJECTS.get(db, project_address=address.lower())
    return project
