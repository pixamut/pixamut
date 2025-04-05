from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from src.core.config import config

print(config.DB_URL, flush=True)
engine = create_async_engine(config.DB_URL, future=True, echo=False)
async_session: sessionmaker[AsyncSession] = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)  # type: ignore
