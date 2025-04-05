from sqlalchemy import PrimaryKeyConstraint, String
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base.base_model import Base


class KeyValueModel(Base):
    __tablename__ = "keyvalue"

    key: Mapped[str] = mapped_column(String(length=255), index=True, nullable=False)
    value: Mapped[str] = mapped_column(String(length=255), nullable=True)

    __table_args__ = (PrimaryKeyConstraint("key"),)

    conflict_key = ["key"]
