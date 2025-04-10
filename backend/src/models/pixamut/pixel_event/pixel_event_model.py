from sqlalchemy import (
    PrimaryKeyConstraint,
    String,
    Integer,
    BigInteger,
    text,
    Numeric,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql.sqltypes import TIMESTAMP
from datetime import datetime

from src.models.base.base_model import Base


class PixelEventModel(Base):
    __tablename__ = "pixel_events"

    log_index: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    hash: Mapped[str] = mapped_column(String, nullable=False)
    pixel_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    stake_amount: Mapped[int] = mapped_column(
        Numeric(precision=78, scale=0), nullable=False, server_default=text("0")
    )
    color: Mapped[int] = mapped_column(Integer, nullable=False)
    owner: Mapped[str] = mapped_column(String, nullable=False, index=True)
    timestamp: Mapped[str] = mapped_column(String, nullable=False, index=True)

    __table_args__ = (PrimaryKeyConstraint("log_index", "timestamp", "pixel_id"),)

    conflict_key = ["log_index", "timestamp", "pixel_id"]
