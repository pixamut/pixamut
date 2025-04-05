from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import asyncio
from os import path
from starlette.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import RedirectResponse

from app.core.config import config
from app.api import v1_api_router
from app.contracts.pixel_listeners import listen_to_pixels_events_loop
from app.contracts.project_factory_listeners import (
    listen_to_project_factory_events_loop,
)
from app.contracts.project_listeners import project_execution_loop
from app.ai.placement.init import init_grid_arrays
from app.contracts.provider import provider_connect
from app.ai.agents.intent_agent import intent_agent

app = FastAPI()

if config.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in config.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )


app.include_router(v1_api_router, prefix=config.API_PREFIX)


@app.on_event("startup")
async def startup_event():
    pass
    await provider_connect()
    await init_grid_arrays()
    asyncio.create_task(listen_to_project_factory_events_loop())
    await asyncio.sleep(1)
    asyncio.create_task(listen_to_pixels_events_loop())
    await asyncio.sleep(1)
    asyncio.create_task(project_execution_loop())
