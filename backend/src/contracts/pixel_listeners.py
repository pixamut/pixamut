from typing import Any, Tuple
from datetime import datetime, timezone
import asyncio
from sqlalchemy.ext.asyncio.session import AsyncSession
from sqlalchemy.util import b

from src.models.session import async_session
from src.models.key_value.key_value_crud import KEYVALUE
from src.models.pixamut.pixel_event.pixel_event_crud import (
    PIXEL_EVENTS,
    PixelEventCreate,
)
from src.api.deps import get_db
from src.models.pixamut.pixel.pixel_crud import PIXELS, PixelCreate
from src.ai.placement.init import update_grid
from src.models.pixamut.project.project_crud import PROJECTS

from .provider import pixel_staking_contract, provider

LAST_INDEXED_BLOCK_FOR_EVENTS = "lastIndexedBlockForEvents"


async def propagate_pixel_event(dbEvent: PixelEventCreate, db: AsyncSession):
    pixel = PixelCreate(
        id=dbEvent.pixel_id,
        owner=dbEvent.owner.lower(),
        color=dbEvent.color,
        stake_amount=dbEvent.stake_amount,
        hash=dbEvent.hash,  # type: ignore
    )
    await PIXELS.create(
        db,
        obj_in=pixel,
    )
    update_grid(pixel)


async def parse_pixel_staked_event(event: Any, db: AsyncSession):
    print("new event: ", event, flush=True)
    block = await provider.eth.get_block(event["blockNumber"])
    block_timestamp = block["timestamp"] if "timestamp" in block else 0

    timestamp = datetime.utcfromtimestamp(block_timestamp)

    event_data = event["args"]
    dbEvent = PixelEventCreate(
        pixel_id=event_data["pixelId"],
        owner=event_data["staker"].lower(),
        stake_amount=event_data["amount"],
        color=event_data["color"],
        log_index=event["logIndex"],
        hash=f"0x{event["transactionHash"].hex().lower()}",
        timestamp=datetime.utcfromtimestamp(block_timestamp),
    )
    await PIXEL_EVENTS.create(db, obj_in=dbEvent)
    await propagate_pixel_event(dbEvent, db)


async def parse_pixels_staked_event(event: Any, db: AsyncSession):
    print("new event: ", event, flush=True)
    block = await provider.eth.get_block(event["blockNumber"])
    block_timestamp = block["timestamp"] if "timestamp" in block else 0

    event_data = event["args"]
    pixelIds = event_data["pixelIds"]
    colors = event_data["colors"]
    amounts = event_data["amounts"]
    owner = event_data["staker"].lower()
    timestamp = datetime.utcfromtimestamp(block_timestamp)
    hash = f"0x{event["transactionHash"].hex().lower()}"
    log_index = event["logIndex"]
    nbrPixels = len(pixelIds)
    for i in range(nbrPixels):
        dbEvent = PixelEventCreate(
            pixel_id=pixelIds[i],
            owner=owner,
            stake_amount=amounts[i],
            color=colors[i],
            log_index=log_index,
            hash=hash,
            timestamp=timestamp,
        )
        await PIXEL_EVENTS.create(db, obj_in=dbEvent)
        await propagate_pixel_event(dbEvent, db)


async def parse_pixel_unstaked_event(event: Any, db: AsyncSession):
    print("new event: ", event, flush=True)
    block = await provider.eth.get_block(event["blockNumber"])
    block_timestamp = block["timestamp"] if "timestamp" in block else 0

    event_data = event["args"]
    dbEvent = PixelEventCreate(
        pixel_id=event_data["pixelId"],
        owner=event_data["staker"].lower(),
        stake_amount=0,
        color=0x000000,
        log_index=event["logIndex"],
        hash=f"0x{event["transactionHash"].hex().lower()}",
        timestamp=datetime.utcfromtimestamp(block_timestamp),
    )
    await PIXEL_EVENTS.create(db, obj_in=dbEvent)
    await propagate_pixel_event(dbEvent, db)


async def parse_pixels_unstaked_event(event: Any, db: AsyncSession):
    print("new event: ", event, flush=True)
    block = await provider.eth.get_block(event["blockNumber"])
    block_timestamp = block["timestamp"] if "timestamp" in block else 0

    event_data = event["args"]
    pixelIds = event_data["pixelIds"]
    owner = event_data["staker"].lower()
    timestamp = datetime.utcfromtimestamp(block_timestamp)
    hash = f"0x{event["transactionHash"].hex().lower()}"
    log_index = event["logIndex"]
    nbrPixels = len(pixelIds)
    for i in range(nbrPixels):
        dbEvent = PixelEventCreate(
            pixel_id=pixelIds[i],
            owner=owner,
            stake_amount=0,
            color=0x000000,
            log_index=log_index,
            hash=hash,
            timestamp=timestamp,
        )
        await PIXEL_EVENTS.create(db, obj_in=dbEvent)
        await propagate_pixel_event(dbEvent, db)


async def parse_pixel_color_changed_event(event: Any, db: AsyncSession):
    print("new event: ", event, flush=True)
    block = await provider.eth.get_block(event["blockNumber"])
    block_timestamp = block["timestamp"] if "timestamp" in block else 0

    event_data = event["args"]
    pixel_id = event_data["pixelId"]
    existing_px = await PIXELS.get(db, pixel_id=pixel_id)
    if existing_px is not None:
        dbEvent = PixelEventCreate(
            pixel_id=pixel_id,
            owner=existing_px.owner,
            stake_amount=existing_px.stake_amount,
            color=event_data["color"],
            log_index=event["logIndex"],
            hash=f"0x{event["transactionHash"].hex().lower()}",
            timestamp=datetime.utcfromtimestamp(block_timestamp),
        )
        await PIXEL_EVENTS.create(db, obj_in=dbEvent)
        await propagate_pixel_event(dbEvent, db)


async def parse_pixels_color_changed_event(event: Any, db: AsyncSession):
    print("new event: ", event, flush=True)
    block = await provider.eth.get_block(event["blockNumber"])
    block_timestamp = block["timestamp"] if "timestamp" in block else 0

    event_data = event["args"]
    pixel_ids = event_data["pixelIds"]
    colors = event_data["colors"]
    timestamp = datetime.utcfromtimestamp(block_timestamp)
    hash = f"0x{event["transactionHash"].hex().lower()}"
    log_index = event["logIndex"]
    nbr_pxs = len(pixel_ids)
    for i in range(nbr_pxs):
        existing_px = await PIXELS.get(db, pixel_id=pixel_ids[i])
        if existing_px is not None:
            dbEvent = PixelEventCreate(
                pixel_id=pixel_ids[i],
                owner=existing_px.owner,
                stake_amount=existing_px.stake_amount,
                color=colors[i],
                log_index=log_index,
                hash=hash,
                timestamp=timestamp,
            )
            await PIXEL_EVENTS.create(db, obj_in=dbEvent)
            await propagate_pixel_event(dbEvent, db)


async def parse_pixel_events(events: list[Any], db) -> str | None:
    if len(events) > 0:
        events.sort(key=lambda e: (e["blockNumber"], e["logIndex"]))
        for event in events:
            if event["event"] == "PixelStaked":
                await parse_pixel_staked_event(event, db)
            elif event["event"] == "PixelsStaked":
                await parse_pixels_staked_event(event, db)
            elif event["event"] == "PixelUnstaked":
                await parse_pixel_unstaked_event(event, db)
            elif event["event"] == "PixelsUnstaked":
                await parse_pixels_unstaked_event(event, db)
            elif event["event"] == "PixelColorChanged":
                await parse_pixel_color_changed_event(event, db)
            elif event["event"] == "PixelsColorChanged":
                await parse_pixels_color_changed_event(event, db)
        latest = events[-1]
        latest_block = latest["blockNumber"] + 1
        await KEYVALUE.set(
            db, key=LAST_INDEXED_BLOCK_FOR_EVENTS, value=str(latest_block)
        )
        return latest_block


async def create_event_filters(from_block: int) -> list[Any]:
    print("creating event filters for ", from_block, flush=True)
    px_staked_event_filter = (
        await pixel_staking_contract.events.PixelStaked.create_filter(
            from_block=from_block
        )
    )
    pxs_staked_event_filter = (
        await pixel_staking_contract.events.PixelsStaked.create_filter(
            from_block=from_block
        )
    )
    px_unstaked_event_filter = (
        await pixel_staking_contract.events.PixelUnstaked.create_filter(
            from_block=from_block
        )
    )
    pxs_unstaked_event_filter = (
        await pixel_staking_contract.events.PixelsUnstaked.create_filter(
            from_block=from_block
        )
    )
    px_color_event_filter = (
        await pixel_staking_contract.events.PixelColorChanged.create_filter(
            from_block=from_block
        )
    )
    pxs_color_event_filter = (
        await pixel_staking_contract.events.PixelsColorChanged.create_filter(
            from_block=from_block
        )
    )
    return [
        px_staked_event_filter,
        pxs_staked_event_filter,
        px_unstaked_event_filter,
        pxs_unstaked_event_filter,
        px_color_event_filter,
        pxs_color_event_filter,
    ]


async def extract_events(filters: list[Any], onlyNew: bool = True) -> list[Any]:
    events = []
    for filter in filters:
        if onlyNew:
            evs = await filter.get_new_entries()
        else:
            evs = await filter.get_all_entries()
        for ev in evs:
            events.append(ev)
    return events


async def catchup(db: AsyncSession) -> int:

    from_block_key_value = await KEYVALUE.get(db, key=LAST_INDEXED_BLOCK_FOR_EVENTS)
    fallback = await provider.eth.get_block_number()
    from_block = (
        int(from_block_key_value.value)
        if from_block_key_value is not None and from_block_key_value != ""
        else 1168727
    )

    from_block = 1175465 if from_block < 1175455 else from_block
    event_filters = await create_event_filters(from_block)

    # more stable liquidity pool
    # advertising in pixels never been done before, only one to give ad places in pixel, examples of crypto punks, we bring revenues. We are leveraging the competive, using that to build a space that more degen friendly.
    # def fetch_logs_in_batches(start_block, end_block, batch_size=1000):
    #     all_logs = []
    #     for block in range(start_block, end_block, batch_size):
    #         batch_end = min(block + batch_size - 1, end_block)
    #         batch_logs = web3.eth.get_logs({
    #             'fromBlock': block,
    #             'toBlock': batch_end,
    #             'address': contract_address,
    #             'topics': [contract.events.MyEvent()._get_event_signature_hex()]
    #         })
    #         all_logs.extend(batch_logs)
    #     return all_logs

    # logs = fetch_logs_in_batches(1000000, web3.eth.block_number)
    # print(logs)

    events = await extract_events(event_filters, False)
    await parse_pixel_events(events, db)
    return from_block


async def listen_to_pixels_events_loop():
    print("starting to listen to pixel events", flush=True)
    async with async_session() as db:

        latest_block = await catchup(db)
        event_filters = await create_event_filters(latest_block)
        while True:
            events = await extract_events(event_filters)
            latest_block = await parse_pixel_events(events, db)

            await asyncio.sleep(2)
