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

from app.models.base import Base


class ProjectSnapshotModel(Base):
    __tablename__ = "project_snapshots"

    address: Mapped[str] = mapped_column(String(length=100), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(length=255), nullable=False, index=True)
    nbr_active_pixels: Mapped[int] = mapped_column(
        Integer, nullable=False, autoincrement=False
    )
    nbr_controlled_pixels: Mapped[int] = mapped_column(
        Integer, nullable=False, autoincrement=False
    )

    balance: Mapped[int] = mapped_column(
        Numeric(precision=78, scale=0), nullable=False, server_default=text("0")
    )
    best_cost: Mapped[int] = mapped_column(
        Numeric(precision=78, scale=0), nullable=True
    )
    best_row: Mapped[int] = mapped_column(Integer, nullable=True, autoincrement=False)
    best_col: Mapped[int] = mapped_column(Integer, nullable=True, autoincrement=False)

    gas_available: Mapped[int] = mapped_column(
        Numeric(precision=78, scale=0), nullable=False, server_default=text("0")
    )
    gas_used: Mapped[int] = mapped_column(
        Numeric(precision=78, scale=0), nullable=False, server_default=text("0")
    )
    __table_args__ = (PrimaryKeyConstraint("created_at"),)

    conflict_key = ["created_at"]
