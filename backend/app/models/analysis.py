from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

class IngredientInput(BaseModel):
    name: str

class AnalysisRequest(BaseModel):
    ingredients: List[str]
    session_id: Optional[str] = None

class AnalysisResponse(BaseModel):
    session_id: str
    safety_analysis: str
    research_attempts: int
    analysis_attempts: int
    critic_approved: bool
    research_confidence: float
    qdrant_hits: int
    tavily_hits: int
    total_critic_rejections: int
    analysis_start_time: datetime
    analysis_end_time: datetime
    
    class Config:
        from_attributes = True

class AnalysisProgress(BaseModel):
    stage: str  # "research", "analysis", "critic", "complete"
    progress: int  # 0-100
    message: str
