from typing import Tuple
import numpy as np

from src.ai.placement.init import grid_weights


def get_weights_for_image(image_shape: Tuple[int, int]):
    global_H, global_W = grid_weights.shape
    H, W = image_shape

    center_row = global_H // 2
    center_col = global_W // 2

    start_row = center_row - H // 2
    start_col = center_col - W // 2

    subgrid = grid_weights[start_row : start_row + H, start_col : start_col + W]
    norm = subgrid.sum()
    subgrid /= norm
    return subgrid


def compute_allocation_of_remaining_budget(
    unused_budget: float, image_h: int, image_w: int
):
    image_weights = get_weights_for_image((image_h, image_w))
    allocations = unused_budget * image_weights
    return allocations
