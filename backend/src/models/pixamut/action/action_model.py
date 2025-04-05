from sqlalchemy import (
    PrimaryKeyConstraint,
    String,
    Integer,
    BigInteger,
    text,
    Text,
    Boolean,
    Numeric,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base.base_model import Base


class ActionModel(Base):
    __tablename__ = "actions"

    address: Mapped[str] = mapped_column(String(length=100), nullable=False, index=True)
    idx: Mapped[int] = mapped_column(Integer, nullable=False, autoincrement=False)
    call: Mapped[dict] = mapped_column(type_=JSONB, nullable=False)
    # pending, failed or tx hash
    hash: Mapped[str] = mapped_column(
        String(length=100), nullable=False, index=True, server_default=text("'pending'")
    )
    gas_used: Mapped[int] = mapped_column(
        Numeric(precision=78, scale=0), nullable=False, server_default=text("0")
    )

    __table_args__ = (PrimaryKeyConstraint("address", "idx"),)

    conflict_key = ["address", "idx"]
