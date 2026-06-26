export interface AnalysisRequest {
  ingredients: string[];
  session_id?: string;
}

export interface AnalysisResponse {
  session_id: string;
  safety_analysis: string;
  research_attempts: number;
  analysis_attempts: number;
  critic_approved: boolean;
  research_confidence: number;
  qdrant_hits: number;
  tavily_hits: number;
  total_critic_rejections: number;
  analysis_start_time: string;
  analysis_end_time: string;
}

export interface AnalysisProgress {
  stage: string;
  progress: number;
  message: string;
}

export interface HistoryEntry {
  timestamp: string;
  ingredient_names: string[];
  safety_analysis?: string;
  critic_approved: boolean;
  research_confidence: number;
}
