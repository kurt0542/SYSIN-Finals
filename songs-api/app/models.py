from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SongBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Title of the song")
    artist: str = Field(..., min_length=1, max_length=200, description="Artist name")
    genre: str = Field(..., min_length=1, max_length=50, description="Music genre")
    duration_seconds: int = Field(..., gt=0, le=3600, description="Duration in seconds (1 to 3600)")


class SongCreate(SongBase):
    pass


class SongUpdate(SongBase):
    pass


class SongResponse(SongBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime | None = None

