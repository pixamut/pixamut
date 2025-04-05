from typing import TYPE_CHECKING
from sqlalchemy import String, Boolean, TIMESTAMP
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime


from src.models.base.base_model import BaseWithTechId


class UserModel(BaseWithTechId):
    __tablename__ = "users"
    username: Mapped[str] = mapped_column(
        String(length=255), unique=True, index=True, nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(length=255), unique=True, index=True, nullable=False
    )
    wallet: Mapped[str] = mapped_column(
        String(length=255), unique=True, index=True, nullable=True
    )
    hashed_password: Mapped[str | None] = mapped_column(
        String(length=255), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    oldest_accepted_token_time: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=False), nullable=True
    )

    picture: Mapped[str | None] = mapped_column(String, nullable=True)
    google_id: Mapped[str | None] = mapped_column(
        String(length=255), nullable=True, unique=True, index=True
    )
    github_id: Mapped[str | None] = mapped_column(
        String(length=255), nullable=True, unique=True, index=True
    )

    joined_pixamut_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=False), index=True, nullable=True
    )
