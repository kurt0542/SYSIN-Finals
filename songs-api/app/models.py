from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SongBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Title of the song")
    artist: str = Field(..., min_length=1, max_length=200, description="Artist name")
    genre: str = Field(..., min_length=1, max_length=50, description="Music genre")
    duration_seconds: int = Field(..., gt=0, le=3600, description="Duration in seconds (1 to 3600)")

class SongCreate(SongBase):
    pass

class SongResponse(SongBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

