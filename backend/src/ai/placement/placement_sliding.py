from typing import Tuple
import numpy as np

from src.ai.placement.init import grid_color, grid_stake, grid_owner


def find_best_placement_full(
    image_color: np.ndarray,
    image_mask: np.ndarray,
    new_owner: int,
    budget: float,
    eager: bool = True,
) -> Tuple[int | None, int | None, float | None]:
    H, W = grid_color.shape
    h, w = image_color.shape
    if h > H or w > W:
        return None, None, None

    best_cost: float | None = None
    best_row: int | None = None
    best_col: int | None = None

    # Loop over every valid placement on the grid.
    for y in range(0, H - h + 1):
        for x in range(0, W - w + 1):
            # Extract the subregions from the grid.
            region_color = grid_color[y : y + h, x : x + w]
            region_owner = grid_owner[y : y + h, x : x + w]
            region_stake = grid_stake[y : y + h, x : x + w]

            # Compute the cost over active pixels:
            # For each pixel, if the grid cell does not match the image pixel,
            # and the grid cell isn’t already owned by new_owner, then add its stake.
            condition = (
                (region_color != image_color) & (region_owner != new_owner) & image_mask
            )
            cost = np.sum(region_stake[condition])

            # Check if this placement is within budget and better than the best found so far.
            if cost <= budget and (best_cost is None or cost < best_cost):
                best_cost = cost
                best_row = y
                best_col = x
                if eager:
                    return best_row, best_col, best_cost

    return best_row, best_col, best_cost


def find_best_placement_sliding(
    image_color: np.ndarray,
    image_mask: np.ndarray,
    new_owner: int,
    budget: float,
    eager: bool = True,
) -> Tuple[int | None, int | None, float | None]:
    H, W = grid_color.shape
    h, w = image_color.shape
    if h > H or w > W:
        return None, None, None

    def partial_cost(y_slc, x_slc, img_slice, mask_slice):
        gc = grid_color[y_slc, x_slc]
        go = grid_owner[y_slc, x_slc]
        gs = grid_stake[y_slc, x_slc]
        base_mask = (gc != img_slice) & (go != new_owner)
        mask = base_mask & mask_slice
        return np.sum(gs[mask])

    # row_costs[x] = cost of placing image at (x, 0)
    row_costs = np.empty(W - w + 1, dtype=np.float64)
    best_cost: float | None = None
    best_row: int | None = None
    best_col: int | None = None

    # ----------------------
    # 1) Cost at (0, 0)
    # ----------------------
    c = partial_cost(slice(0, h), slice(0, w), image_color, image_mask)
    row_costs[0] = c
    if c <= budget:
        best_cost = c
        best_row = 0
        best_col = 0
        if eager:
            return best_row, best_col, best_cost

    # ----------------------
    # 2) Horizontal slides in row 0
    # ----------------------
    for x in range(1, W - w + 1):
        # Remove left column
        col_remove = partial_cost(
            slice(0, h),  # same row range
            slice(x - 1, x),  # just column x-1
            image_color[:, 0:1],  # image's leftmost column
            image_mask[:, 0:1],
        )
        # Add new right column
        col_add = partial_cost(
            slice(0, h),  # same row range
            slice(x + w - 1, x + w),
            image_color[:, w - 1 : w],  # image's rightmost column
            image_mask[:, w - 1 : w],
        )
        c = c - col_remove + col_add
        row_costs[x] = c
        if c <= budget and (best_cost is None or c < best_cost):
            best_cost, best_col, best_row = c, x, 0
            if eager:
                return best_row, best_col, best_cost

    # ----------------------
    # 3) Slide down row by row
    # ----------------------
    for y in range(1, H - h + 1):
        new_row_costs = np.empty_like(row_costs)

        # (x=0): from row_costs[0] => remove top row, add bottom row
        old_c = row_costs[0]

        row_remove = partial_cost(
            slice(y - 1, y),  # top row being removed
            slice(0, w),
            image_color[0:1, :],  # image's top row
            image_mask[0:1, :],
        )
        row_add = partial_cost(
            slice(y + h - 1, y + h),  # new bottom row
            slice(0, w),
            image_color[h - 1 : h, :],  # image's bottom row
            image_mask[h - 1 : h, :],
        )
        c0 = old_c - row_remove + row_add
        new_row_costs[0] = c0
        if c0 <= budget and (best_cost is None or c0 < best_cost):
            best_cost, best_col, best_row = c0, 0, y
            if eager:
                return best_row, best_col, best_cost

        # Slide horizontally in row y
        for x in range(1, W - w + 1):
            # 1) Start from row_costs[x] => remove top row, add bottom row
            old_cx = row_costs[x]

            row_remove = partial_cost(
                slice(y - 1, y),
                slice(x, x + w),
                image_color[0:1, :],
                image_mask[0:1, :],
            )
            row_add = partial_cost(
                slice(y + h - 1, y + h),
                slice(x, x + w),
                image_color[h - 1 : h, :],
                image_mask[h - 1 : h, :],
            )
            c_row = old_cx - row_remove + row_add

            # 2) remove left col, add right col
            col_remove = partial_cost(
                slice(y, y + h),
                slice(x - 1, x),
                image_color[:, 0:1],
                image_mask[:, 0:1],
            )
            col_add = partial_cost(
                slice(y, y + h),
                slice(x + w - 1, x + w),
                image_color[:, w - 1 : w],
                image_mask[:, w - 1 : w],
            )
            c_new = c_row - col_remove + col_add

            new_row_costs[x] = c_new
            if c_new <= budget and (best_cost is None or c_new < best_cost):
                best_cost, best_col, best_row = c_new, x, y
                if eager:
                    return best_row, best_col, best_cost

        row_costs = new_row_costs

    if best_cost is None:
        return None, None, None
    return best_row, best_col, best_cost
