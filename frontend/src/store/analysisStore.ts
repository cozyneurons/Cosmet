import { create } from 'zustand';
import { AnalysisResponse, AnalysisProgress } from '@/types/analysis';

interface AnalysisState {
  currentAnalysis: AnalysisResponse | null;
  progress: AnalysisProgress | null;
  isAnalyzing: boolean;
  setAnalysis: (analysis: AnalysisResponse) => void;
  setProgress: (progress: AnalysisProgress | null) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  currentAnalysis: null,
  progress: null,
  isAnalyzing: false,
  
  setAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setProgress: (progress) => set({ progress }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  reset: () => set({ currentAnalysis: null, progress: null, isAnalyzing: false }),
}));
