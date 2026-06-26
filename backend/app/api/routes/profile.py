from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from app.models.user import UserResponse
from app.models.profile import ProfileUpdate, ProfileResponse
from app.api.deps import get_current_active_user
from app.services.memory.redis_client import get_redis_client

router = APIRouter()

@router.get("/", response_model=ProfileResponse)
async def get_profile(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get user's skincare profile"""
    redis_client = get_redis_client()
    profile = redis_client.get_user_profile(current_user.id)
    
    if not profile:
        # Return empty profile
        return ProfileResponse(
            user_id=current_user.id,
            skin_type="normal",
            allergies=[],
            expertise_level="beginner",
            concerns=[]
        )
    
    # In Redis, list fields (like allergies, concerns) are stored as JSON-encoded strings or we need to parse them
    # Let's handle string lists safely if they were stored as stringified lists in Redis
    import json
    
    allergies = profile.get("allergies", [])
    if isinstance(allergies, str):
        try:
            allergies = json.loads(allergies)
        except Exception:
            allergies = [allergies] if allergies else []
            
    concerns = profile.get("concerns", [])
    if isinstance(concerns, str):
        try:
            concerns = json.loads(concerns)
        except Exception:
            concerns = [concerns] if concerns else []
            
    return ProfileResponse(
        user_id=current_user.id,
        skin_type=profile.get("skin_type", "normal"),
        allergies=allergies,
        expertise_level=profile.get("expertise_level", "beginner"),
        concerns=concerns,
        updated_at=profile.get("updated_at")
    )

@router.put("/", response_model=ProfileResponse)
async def update_profile(
    profile_update: ProfileUpdate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Update user's skincare profile"""
    redis_client = get_redis_client()
    
    # Store allergies and concerns as JSON strings so Redis can store them easily as hashes if needed,
    # or let the RedisClient serialize the entire profile dict.
    # In our redis_client.py:
    # save_user_profile serializes the entire dict: profile_json = json.dumps(profile), self.client.set(key, profile_json)
    # Since it is serialized as a full json string using json.dumps, the lists will be serialized perfectly!
    # So we can pass lists directly.
    profile_dict = {
        "user_id": current_user.id,
        "skin_type": profile_update.skin_type,
        "allergies": profile_update.allergies,
        "expertise_level": profile_update.expertise_level,
        "concerns": profile_update.concerns,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    redis_client.save_user_profile(current_user.id, profile_dict)
    
    return ProfileResponse(**profile_dict)
