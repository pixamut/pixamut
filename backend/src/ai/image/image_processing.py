from typing import Tuple
import numpy as np
import base64
import io
from PIL import Image


def image_to_np(
    imageUrl: str, alpha_threshold: int = 128
) -> Tuple[np.ndarray, np.ndarray]:
    print("image to np", flush=True)
    image_data = imageUrl.split(",")[1]
    image_bytes = base64.b64decode(image_data)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

    image_array = np.array(image, dtype=np.uint8)
    image_grid = (
        (image_array[:, :, 0].astype(np.uint32) << 16)
        + (image_array[:, :, 1].astype(np.uint32) << 8)
        + image_array[:, :, 2].astype(np.uint32)
    )
    alpha = image_array[:, :, 3]
    image_mask = (alpha >= alpha_threshold).astype(np.bool_)
    return image_grid, image_mask
