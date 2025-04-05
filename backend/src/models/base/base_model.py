from datetime import datetime
from sqlalchemy import Integer, func, BOOLEAN
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql.sqltypes import TIMESTAMP


class Base(DeclarativeBase):
    __abstract__ = True
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        index=True,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    deleted_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), index=True, nullable=True
    )

    conflict_key: list[str] = []


class BaseWithTechId(Base):
    __abstract__ = True
    tech_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    conflict_key: list[str] = ["tech_id"]
