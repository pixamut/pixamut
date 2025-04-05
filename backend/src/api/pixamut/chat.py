from pydantic import BaseModel
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from fastapi.exceptions import HTTPException
import asyncio
import json
from typing import List, Dict

# from openai.types.chat import ChatCompletionMessageParam
# import openai

from src.api.deps import get_db
from src.models.pixamut.chat_schema import ChatRequest, ChatMessage
from src.core.config import config

# from src.ai.agents.intent_agent import intent_agent
# from app.ai.agents.commentator_agent import commentator_agent
from src.models.pixamut.project.project_crud import PROJECTS, ProjectModel
from src.models.pixamut.project_snapshot.project_snapshot_crud import (
    PROJECT_SNAPSHOTS,
    ProjectSnapshotModel,
)

# openai.api_key = config.OPENAI_KEY

router = APIRouter()


@router.post("/")
async def chat_endpoint(chat: ChatRequest):
    chat_messages = [
        {"role": msg.role, "content": msg.content} for msg in chat.messages
    ]
    try:
        # response = intent_agent.prompt_llm_with_messages(messages=chat_messages)
        # response = openai.chat.completions.create(
        #     model="gpt-3.5-turbo", messages=chat_messages, stream=False  # type: ignore
        # )
        response = "hello"
    except Exception as e:
        print("error")
        print(e, flush=True)
        raise HTTPException(status_code=500, detail=str(e))

    full_response = response
    return {"response": full_response}


@router.post("/commentator")
async def comment_endpoint(chat: ChatRequest, db=Depends(get_db)):
    def project_to_dict(project: ProjectModel) -> Dict:
        return {
            "address": project.address,
            "title": project.title,
            "image": project.image,  # e.g. data URL or base64
        }

    def snapshot_to_dict(snapshot: ProjectSnapshotModel) -> Dict:
        return {
            "address": snapshot.address,
            "title": snapshot.title,
            "nbr_active_pixels": snapshot.nbr_active_pixels,
            "nbr_controlled_pixels": snapshot.nbr_controlled_pixels,
            "balance": str(snapshot.balance),
            "best_cost": (
                str(snapshot.best_cost) if snapshot.best_cost is not None else None
            ),
            "best_row": snapshot.best_row,
            "best_col": snapshot.best_col,
            "gas_available": str(snapshot.gas_available),
            "gas_used": str(snapshot.gas_used),
        }

    projects = await PROJECTS.get_many(db)
    snapshots = await PROJECT_SNAPSHOTS.get_recent(db)
    projects_data = [project_to_dict(p) for p in projects]
    snapshots_data = [snapshot_to_dict(s) for s in snapshots]

    chat_messages = [
        {
            "role": "user",
            "content": f"Here is the current project and snapshot data:\n\nProjects: {json.dumps(projects_data, indent=2)}\n\nSnapshots: {json.dumps(snapshots_data, indent=2)}\n",
        }
    ]
    chat_messages.extend(
        [{"role": msg.role, "content": msg.content} for msg in chat.messages]
    )
    # try:
    response = commentator_agent.prompt_llm_with_messages(messages=chat_messages)
    # response = openai.chat.completions.create(
    #     model="gpt-3.5-turbo", messages=chat_messages, stream=False  # type: ignore
    # )
    # except Exception as e:
    #     print("error")
    #     print(e, flush=True)
    #     raise HTTPException(status_code=500, detail=str(e))

    full_response = response
    return {"response": full_response}
