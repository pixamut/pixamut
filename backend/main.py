from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import asyncio
from os import path
from starlette.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import RedirectResponse

import openai

from src.core.config import config
from src.api import api_router
from src.contracts.pixel_listeners import listen_to_pixels_events_loop
from src.contracts.project_factory_listeners import (
    listen_to_project_factory_events_loop,
)
from src.contracts.project_listeners import project_execution_loop
from src.ai.placement.init import init_grid_arrays
from src.contracts.provider import provider_connect

openai.api_key = config.OPENAI_KEY

app = FastAPI()

if config.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in config.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )


app.include_router(api_router, prefix=config.API_PREFIX)


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
