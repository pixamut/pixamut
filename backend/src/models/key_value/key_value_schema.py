from datetime import datetime
from pydantic import BaseModel


class KeyValue(BaseModel):
    key: str
    value: str


class KeyValueInDB(KeyValue):
    updated_at: datetime
    created_at: datetime
    deleted_at: datetime

    class Config:
        from_attributes = True
