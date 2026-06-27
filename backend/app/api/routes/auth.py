from fastapi import APIRouter, Depends, HTTPException, status, Body
from datetime import timedelta
from app.models.user import UserResponse, Token, GoogleLoginRequest
from app.core.security import create_access_token, create_refresh_token
from app.core.config import settings
from app.api.deps import get_auth_service, get_current_active_user
from app.services.auth_service import AuthService
from google.oauth2 import id_token
from google.auth.transport import requests

router = APIRouter()

@router.post("/google", response_model=Token)
async def google_login(
    payload: GoogleLoginRequest = Body(...),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Login with Google credential token (auto-registering user if new)"""
    try:
        # Verify Google OAuth token
        idinfo = id_token.verify_oauth2_token(
            payload.credential,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        
        email = idinfo.get("email")
        name = idinfo.get("name", email.split("@")[0] if email else "User")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google token"
            )
            
        user = await auth_service.login_or_register_google_user(email, name)
        
        access_token = create_access_token(
            data={"sub": user.id},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        refresh_token = create_refresh_token(data={"sub": user.id})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google credentials: {str(e)}"
        )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str = Body(..., embed=True),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Refresh access token using refresh token"""
    from app.core.security import decode_token
    
    payload = decode_token(refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = await auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    new_refresh_token = create_refresh_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get current user profile"""
    return current_user

@router.post("/logout")
async def logout(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Logout user (client-side token removal)"""
    return {"message": "Successfully logged out"}
