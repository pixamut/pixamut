from fastapi import APIRouter

from . import login, users, stakeifys

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(stakeifys.router, prefix="/stake", tags=["stake"])
