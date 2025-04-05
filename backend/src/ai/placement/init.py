from decimal import Decimal
from typing import Tuple
import numpy as np
from PIL import Image
import asyncio

from src.models.pixamut.pixel.pixel_crud import (
    PIXELS,
    PixelModel,
    PixelCreate,
    PixelBase,
)
from src.models.session import async_session
from src.ai.utils import hash_address
from src.contracts.provider import pixel_staking_contract

GRID_H = 100
GRID_W = 100

grid_color: np.ndarray = np.zeros((GRID_H, GRID_W), dtype=np.uint32)
grid_owner: np.ndarray = np.zeros((GRID_H, GRID_W), dtype=np.uint32)
grid_stake: np.ndarray = np.full((GRID_H, GRID_W), 1e-18, dtype=np.float64)
grid_weights: np.ndarray = np.ones((GRID_H, GRID_W), dtype=np.float32)


def get_staked_by_owner_in_eth(owner_address: str) -> int:
    owner = hash_address(owner_address)
    return np.sum(grid_stake[grid_owner == owner])


def coords_to_id(*, row: int, col: int):
    return row * GRID_W + col


def id_to_coords(id: int) -> Tuple[int, int]:
    col = id % GRID_W
    row = id // GRID_H
    return row, col  # WARNING the x represent the col and y represent the row


def wei_to_ether(amount: int) -> float:
    return float(amount / Decimal("1e18"))


def ether_to_wei(amount: Decimal | float) -> int:
    return int(np.floor(float(amount) * 1e18))


def update_grid(pixel: PixelBase | PixelModel):
    global grid_color, grid_owner, grid_stake
    row, col = id_to_coords(pixel.id)
    grid_color[row, col] = pixel.color
    grid_owner[row, col] = hash_address(pixel.owner.lower())
    grid_stake[row, col] = wei_to_ether(pixel.stake_amount + 1)


def compute_global_weights():
    global grid_weights
    H, W = grid_weights.shape
    center_row, center_col = (H - 1) / 2.0, (W - 1) / 2.0
    y, x = np.indices(grid_weights.shape)
    d = np.sqrt((y - center_row) ** 2 + (x - center_col) ** 2)
    grid_weights += 1.0 / (1.0 + d)

    grid_weights /= grid_weights.sum()


async def init_grid_arrays():
    global grid_color, grid_owner, grid_stake
    # compute_global_weights()

    async with async_session() as db:
        # for i in range(GRID_H * GRID_W):
        #     pixel_data = await pixel_staking_contract.functions.pixels(i).call()  # type: ignore
        #     pixel = PixelCreate(
        #         id=i,
        #         owner=pixel_data[0].lower(),
        #         color=pixel_data[1],
        #         stake_amount=pixel_data[2],
        #     )
        #     await PIXELS.create(
        #         db,
        #         obj_in=pixel,
        #     )
        #     update_grid(pixel)
        pixels = await PIXELS.get_many(db)
        for pixel in pixels:
            update_grid(pixel)
