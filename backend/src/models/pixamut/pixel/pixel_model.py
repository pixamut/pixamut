from sqlalchemy import PrimaryKeyConstraint, String, Integer, BigInteger, text, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base.base_crud import Base


class PixelModel(Base):
    __tablename__ = "pixels"

    id: Mapped[int] = mapped_column(
        Integer, index=True, nullable=False, autoincrement=False
    )
    # x: Mapped[int] = mapped_column(
    #     Integer,
    #     index=False,
    #     nullable=False,
    #     autoincrement=False,
    #     server_default=text("0"),
    # )
    # y: Mapped[int] = mapped_column(
    #     Integer,
    #     index=False,
    #     nullable=False,
    #     autoincrement=False,
    #     server_default=text("0"),
    # )

    color: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    owner: Mapped[str] = mapped_column(String(length=100), nullable=True, index=True)
    stake_amount: Mapped[int] = mapped_column(
        Numeric(precision=78, scale=0), nullable=False, server_default=text("0")
    )
    hash: Mapped[str] = mapped_column(
        String,
        nullable=False,
        server_default="0x0000000000000000000000000000000000000000000000000000000000000000",
    )

    __table_args__ = (PrimaryKeyConstraint("id"),)

    conflict_key = ["id"]
