import asyncio
from typing import Dict, List
from app.models.analysis import AnalysisRequest, AnalysisResponse, AnalysisProgress
from app.services.graph.workflow import run_analysis
from app.services.memory.session import SessionManager
from app.api.routes.websocket import manager

class AnalysisService:
    def __init__(self):
        from app.services.memory.session import get_session_manager
        self.session_manager = get_session_manager()
    
    async def run_analysis_with_progress(
        self,
        request: AnalysisRequest,
        user_id: str,
        user_name: str,
        skin_type: str,
        allergies: List[str],
        expertise_level: str
    ) -> AnalysisResponse:
        """Run analysis with progress updates via WebSocket (non-blocking)"""
        
        # Get or create session
        session_id = self.session_manager.get_or_create_session(user_id, request.session_id)
        
        # Load user profile from session if available
        profile = self.session_manager.get_user_profile(session_id)
        if profile:
            skin_type = profile.get("skin_type", skin_type)
            allergies = profile.get("allergies", allergies)
            expertise_level = profile.get("expertise_level", expertise_level)
        
        # 1. Start stage: Research
        await manager.send_progress(session_id, {
            "stage": "research",
            "progress": 25,
            "message": "Supervisor starting multi-agent flow. Initiating ingredient research..."
        })
        
        # Run the actual multi-agent analysis in a separate thread so we don't freeze the event loop
        result = await asyncio.to_thread(
            run_analysis,
            ingredient_names=request.ingredients,
            user_name=user_name,
            skin_type=skin_type,
            allergies=allergies,
            expertise_level=expertise_level,
            session_id=session_id
        )
        
        # 2. Final stage: Complete
        await manager.send_progress(session_id, {
            "stage": "complete",
            "progress": 100,
            "message": "Analysis successfully validated by Critic and finalized!"
        })
        
        # Save analysis report to memory/history
        self.session_manager.add_to_history(session_id, result)
        
        # Convert dictionary values to match AnalysisResponse model fields
        return AnalysisResponse(
            session_id=session_id,
            safety_analysis=result.get("safety_analysis", ""),
            research_attempts=result.get("research_attempts", 0),
            analysis_attempts=result.get("analysis_attempts", 0),
            critic_approved=result.get("critic_approved", False),
            research_confidence=result.get("research_confidence", 0.0),
            qdrant_hits=result.get("qdrant_hits", 0),
            tavily_hits=result.get("tavily_hits", 0),
            total_critic_rejections=result.get("total_critic_rejections", 0),
            analysis_start_time=result.get("analysis_start_time", ""),
            analysis_end_time=result.get("analysis_end_time", "")
        )
    
    async def get_analysis_history(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get user's analysis history"""
        session_id = self.session_manager.get_or_create_session(user_id)
        history = self.session_manager.get_analysis_history(session_id, include_longterm=True)
        return history[:limit]
