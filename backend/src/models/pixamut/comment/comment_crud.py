from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, update, func

from src.models.base.base_crud import CRUDBase
from .comment_model import CommentModel
from .comment_schema import CommentCreate, CommentUpdate


class CRUDComments(CRUDBase[CommentModel, CommentCreate, CommentUpdate]):
    pass


COMMENTS = CRUDComments(CommentModel)
