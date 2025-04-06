from sqlalchemy import (
    Numeric,
    PrimaryKeyConstraint,
    String,
    Integer,
    BigInteger,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql.sqltypes import TIMESTAMP
from datetime import datetime

from src.models.base.base_model import Base


class ProjectEventModel(Base):
    __tablename__ = "project_events"

    log_index: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    hash: Mapped[str] = mapped_column(String(100), nullable=False)
    project_address: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )
    amount: Mapped[int] = mapped_column(
        Numeric(precision=78, scale=0), nullable=False, server_default=text("0")
    )
    gas: Mapped[int] = mapped_column(
        Numeric(precision=78, scale=0), nullable=False, server_default=text("0")
    )
    user: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    timestamp: Mapped[str] = mapped_column(String, nullable=False, index=True)

    __table_args__ = (PrimaryKeyConstraint("log_index", "timestamp"),)

    conflict_key = ["log_index", "timestamp"]
