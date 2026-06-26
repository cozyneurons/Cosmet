from typing import Optional
from datetime import datetime
import uuid
from app.core.security import get_password_hash, verify_password
from app.models.user import UserCreate, UserResponse
from app.services.memory.redis_client import get_redis_client

class AuthService:
    def __init__(self):
        self.redis_client = get_redis_client()
    
    async def register_user(self, user_data: UserCreate) -> UserResponse:
        """Register a new user"""
        # Check if user already exists
        existing_user = self.redis_client.get_user_by_email(user_data.email)
        if existing_user:
            raise ValueError("User already exists")
        
        # Create new user
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(user_data.password)
        
        user_dict = {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "age_group": user_data.age_group,
            "sex": user_data.sex,
            "country": user_data.country or "",
            "hashed_password": hashed_password,
            "created_at": datetime.utcnow().isoformat(),
            "is_active": "True"  # Redis hset stores as strings
        }
        
        # Save to Redis
        self.redis_client.save_user(user_id, user_dict)
        
        # Format response
        user_response_dict = user_dict.copy()
        user_response_dict["is_active"] = True
        return UserResponse(**user_response_dict)
    
    async def authenticate_user(self, email: str, password: str) -> Optional[UserResponse]:
        """Authenticate user with email and password"""
        user = self.redis_client.get_user_by_email(email)
        if not user:
            return None
        
        if not verify_password(password, user.get("hashed_password", "")):
            return None
        
        # Convert fields for Pydantic
        user_response_dict = user.copy()
        user_response_dict["is_active"] = user.get("is_active") == "True" or user.get("is_active") is True
        return UserResponse(**user_response_dict)
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        """Get user by ID"""
        user = self.redis_client.get_user(user_id)
        if user:
            user_response_dict = user.copy()
            user_response_dict["is_active"] = user.get("is_active") == "True" or user.get("is_active") is True
            return UserResponse(**user_response_dict)
        return None
