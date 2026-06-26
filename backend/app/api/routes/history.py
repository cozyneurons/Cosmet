from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.user import UserResponse
from app.api.deps import get_current_active_user
from app.services.analysis_service import AnalysisService

router = APIRouter()

@router.get("/")
async def get_history(
    limit: int = 50,
    current_user: UserResponse = Depends(get_current_active_user),
    analysis_service: AnalysisService = Depends()
):
    """Get user's analysis history"""
    try:
        history = await analysis_service.get_analysis_history(current_user.id, limit)
        return {
            "history": history,
            "count": len(history)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch history: {str(e)}"
        )

@router.delete("/")
async def clear_history(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Clear user's analysis history"""
    from app.services.memory.session import get_session_manager
    
    session_manager = get_session_manager()
    session_id = session_manager.get_or_create_session(current_user.id)
    session_manager.clear_session(session_id)
    
    # Also clear from Redis
    from app.services.memory.redis_client import get_redis_client
    redis_client = get_redis_client()
    # In fallback or live Redis, clear history using user name/id
    redis_client.clear_analysis_history(current_user.id)
    
    return {"message": "History cleared successfully"}
