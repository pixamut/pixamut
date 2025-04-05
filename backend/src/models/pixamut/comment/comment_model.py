from sqlalchemy import (
    LargeBinary,
    Numeric,
    PrimaryKeyConstraint,
    String,
    Integer,
    BigInteger,
    text,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base.base_model import Base


class CommentModel(Base):
    __tablename__ = "comments"

    content: Mapped[str] = mapped_column(Text, nullable=False, index=False)

    __table_args__ = (PrimaryKeyConstraint("created_at"),)

    conflict_key = ["created_at"]
