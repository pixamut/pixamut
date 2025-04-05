from pydantic import BaseModel
from fastapi import APIRouter, Depends
from fastapi.exceptions import HTTPException
import re
import io
import base64
from PIL import Image

from app.api.deps import get_db
from app.ai.pixelart.image_processing import image_to_np
from app.schemas.stakeifys.project import ProjectCreate

router = APIRouter()


@router.post("/")
def process_image(req: ProjectCreate, db=Depends(get_db)):
    base64_image = req.image

    try:
        image_bytes = base64.b64decode(base64_image)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid base64 image") from e

    try:
        pil_img = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Could not open image") from e

    image_grid = image_to_np(pil_img)
