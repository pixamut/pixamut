import numpy as np
from typing import Any
from datetime import datetime, timezone
import asyncio
from sqlalchemy.ext.asyncio.session import AsyncSession

from src.models.session import async_session
from src.models.key_value.key_value_crud import KEYVALUE
from src.api.deps import get_db
from src.models.pixamut.project.project_crud import PROJECTS, ProjectCreate
from src.models.pixamut.project_event.project_event_crud import (
    PROJECT_EVENTS,
    ProjectEventCreate,
)
from src.ai.image.image_processing import image_to_np
from src.ai.placement.placement_sliding import find_best_placement_sliding
from src.ai.placement.placement_actions import generate_actions_for_placement
from src.ai.utils import hash_address
from src.models.pixamut.action.action_crud import ACTIONS

from .provider import factory_contract, provider

LAST_INDEXED_BLOCK_FOR_PROJECTS = "lastIndexedBlockForProjects"


async def propagate_project_event(dbProjectEvent: ProjectEventCreate, db: AsyncSession):
    await PROJECTS.update_balance(
        db, project_address=dbProjectEvent.project_address, amount=dbProjectEvent.amount
    )


async def parse_project_created_event(event: Any, db: AsyncSession):
    try:
        print("new Project Created Event: ", event, flush=True)
        event_data = event["args"]
        image_base64 = event_data["base64Image"]
        image_grid_np, image_mask_np = image_to_np(image_base64)
        image_h, image_w = image_grid_np.shape
        nbr_active_pixels = np.count_nonzero(image_mask_np)
        image_grid = image_grid_np.tobytes()
        image_mask = image_mask_np.tobytes()

        print("nbr pixels", nbr_active_pixels, "/", image_h * image_w, flush=True)
        dbProject: ProjectCreate = ProjectCreate(
            address=event_data["projectAddress"].lower(),
            title=event_data["title"],
            creator=event_data["creator"].lower(),
            image=image_base64,
            image_grid=image_grid,
            image_mask=image_mask,
            image_h=image_h,
            image_w=image_w,
            nbr_active_pixels=nbr_active_pixels,
            gas_available=event_data["initialgas"],
        )
        print("saving to database", dbProject.image, flush=True)
        await PROJECTS.create(db, obj_in=dbProject)
    except Exception as e:
        print(e, flush=True)


async def parse_project_deposit_event(event: Any, db: AsyncSession):
    try:
        print("new Project Deposit Event: ", event, flush=True)
        event_data = event["args"]
        block = await provider.eth.get_block(event["blockNumber"])
        block_timestamp = block["timestamp"] if "timestamp" in block else 0

        dbProjectEvent: ProjectEventCreate = ProjectEventCreate(
            project_address=event_data["projectAddress"].lower(),
            log_index=event["logIndex"],
            user=event_data["user"].lower(),
            amount=event_data["amount"],
            gas=event_data["gas"],
            hash=f"0x{event["transactionHash"].hex().lower()}",
            timestamp=datetime.utcfromtimestamp(block_timestamp),
        )
        await PROJECT_EVENTS.create(db, obj_in=dbProjectEvent)
        await propagate_project_event(dbProjectEvent, db)
    except Exception as e:
        print(e, flush=True)


async def parse_project_withdrawal_event(event: Any, db: AsyncSession):
    try:
        print("new Project Withdrawal Event: ", event, flush=True)
        event_data = event["args"]
        block = await provider.eth.get_block(event["blockNumber"])
        block_timestamp = block["timestamp"] if "timestamp" in block else 0

        dbProjectEvent: ProjectEventCreate = ProjectEventCreate(
            project_address=event_data["projectAddress"].lower(),
            log_index=event["logIndex"],
            user=event_data["user"].lower(),
            amount=-1 * int(event_data["amount"]),
            gas=0,
            hash=f"0x{event["transactionHash"].hex().lower()}",
            timestamp=datetime.utcfromtimestamp(block_timestamp),
        )
        await PROJECT_EVENTS.create(db, obj_in=dbProjectEvent)
        await propagate_project_event(dbProjectEvent, db)
    except Exception as e:
        print(e, flush=True)


async def parse_project_factory_events(events: list[Any], db) -> str | None:
    if len(events) > 0:
        events.sort(key=lambda e: (e["blockNumber"], e["logIndex"]))
        for event in events:
            if event["event"] == "ProjectCreated":
                await parse_project_created_event(event, db)
            elif event["event"] == "Deposit":
                await parse_project_deposit_event(event, db)
            elif event["event"] == "Withdrawal":
                await parse_project_withdrawal_event(event, db)
        latest = events[-1]
        latest_block = latest["blockNumber"] + 1
        await KEYVALUE.set(
            db, key=LAST_INDEXED_BLOCK_FOR_PROJECTS, value=str(latest_block)
        )
        return latest_block


async def catchup(db: AsyncSession) -> int:
    from_block_key_value = await KEYVALUE.get(db, key=LAST_INDEXED_BLOCK_FOR_PROJECTS)
    fallback = await provider.eth.get_block_number()
    from_block = (
        int(from_block_key_value.value)
        if from_block_key_value is not None
        else fallback - 10_000
    )

    from_block = 1168727

    # Create the filters initially
    project_created_event_filter = (
        await factory_contract.events.ProjectCreated.create_filter(
            from_block=from_block
        )
    )
    project_deposit_event_filter = await factory_contract.events.Deposit.create_filter(
        from_block=from_block
    )
    project_withdrawal_event_filter = (
        await factory_contract.events.Withdrawal.create_filter(from_block=from_block)
    )

    # Helper function to attempt fetching events and recreate filter if needed
    async def get_events(filter_obj, create_filter_func):
        try:
            return await filter_obj.get_all_entries()
        except ValueError as e:
            if "filter not found" in str(e):
                # Recreate the filter if it's dropped
                new_filter = await create_filter_func(from_block=from_block)
                return await new_filter.get_all_entries()
            else:
                raise

    events = []

    # Retrieve events with error handling for each filter
    project_created_events = await get_events(
        project_created_event_filter,
        factory_contract.events.ProjectCreated.create_filter,
    )
    events.extend(project_created_events)

    project_deposit_events = await get_events(
        project_deposit_event_filter,
        factory_contract.events.Deposit.create_filter,
    )
    events.extend(project_deposit_events)

    project_withdrawal_events = await get_events(
        project_withdrawal_event_filter,
        factory_contract.events.Withdrawal.create_filter,
    )
    events.extend(project_withdrawal_events)

    await parse_project_factory_events(events, db)
    return from_block


async def listen_to_project_factory_events_loop():
    print("starting to listen to project factory events", flush=True)
    async with async_session() as db:
        latest_block = await catchup(db)
        project_created_event_filter = (
            await factory_contract.events.ProjectCreated.create_filter(
                from_block=latest_block
            )
        )

        project_deposit_event_filter = (
            await factory_contract.events.Deposit.create_filter(from_block=latest_block)
        )
        project_withdrawal_event_filter = (
            await factory_contract.events.Withdrawal.create_filter(
                from_block=latest_block
            )
        )

        while True:
            events = []
            project_created_events = (
                await project_created_event_filter.get_new_entries()
            )
            for event in project_created_events:
                events.append(event)
            project_deposit_events = (
                await project_deposit_event_filter.get_new_entries()
            )
            for event in project_deposit_events:
                events.append(event)
            project_withdrawal_events = (
                await project_withdrawal_event_filter.get_new_entries()
            )
            for event in project_withdrawal_events:
                events.append(event)
            latest_block = await parse_project_factory_events(events, db)
            await asyncio.sleep(2)
