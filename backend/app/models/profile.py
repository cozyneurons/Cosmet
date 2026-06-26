from pydantic import BaseModel
from typing import List, Optional

class ProfileUpdate(BaseModel):
    skin_type: str  # normal, sensitive, oily, dry, combination
    allergies: List[str]
    expertise_level: str  # beginner, intermediate, expert
    concerns: List[str]

class ProfileResponse(ProfileUpdate):
    user_id: str
    updated_at: Optional[str] = None
