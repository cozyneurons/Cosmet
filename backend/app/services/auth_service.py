from typing import Optional
from datetime import datetime
import uuid
from app.models.user import UserResponse
from app.services.memory.redis_client import get_redis_client

class AuthService:
    def __init__(self):
        self.redis_client = get_redis_client()
    

    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        """Get user by ID"""
        user = self.redis_client.get_user(user_id)
        if user:
            user_response_dict = user.copy()
            user_response_dict["is_active"] = user.get("is_active") == "True" or user.get("is_active") is True
            return UserResponse(**user_response_dict)
        return None

    async def login_or_register_google_user(self, email: str, name: str) -> UserResponse:
        """Find or register a user logging in via Google"""
        existing_user = self.redis_client.get_user_by_email(email)
        if existing_user:
            user_response_dict = existing_user.copy()
            user_response_dict["is_active"] = existing_user.get("is_active") == "True" or existing_user.get("is_active") is True
            return UserResponse(**user_response_dict)
        
        # Auto-register user
        user_id = str(uuid.uuid4())
        user_dict = {
            "id": user_id,
            "email": email,
            "name": name,
            "age_group": "Not specified",
            "sex": "Prefer not to say",
            "country": "",
            "created_at": datetime.utcnow().isoformat(),
            "is_active": "True"
        }
        
        self.redis_client.save_user(user_id, user_dict)
        
        user_response_dict = user_dict.copy()
        user_response_dict["is_active"] = True
        return UserResponse(**user_response_dict)

