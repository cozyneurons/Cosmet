'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { useAnalysisStore } from '@/store/analysisStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import IngredientInput from '@/components/analysis/IngredientInput';
import ProgressBar from '@/components/analysis/ProgressBar';
// import AgentWorkflowDiagram from '@/components/analysis/AgentWorkflowDiagram';
import { ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const AnalysisResults = dynamic(() => import('@/components/analysis/AnalysisResults'), {
  loading: () => (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-zinc-200 p-6 space-y-4 mt-8">
      <Skeleton className="h-8 w-1/3 bg-zinc-200" />
      <Skeleton className="h-4 w-full bg-zinc-200" />
      <Skeleton className="h-4 w-5/6 bg-zinc-200" />
      <Skeleton className="h-4.5 w-1/2 bg-zinc-200 mt-6" />
    </div>
  ),
  ssr: false,
});

export default function AnalyzePage() {
  const { setAnalysis, setAnalyzing, reset, isAnalyzing } = useAnalysisStore();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  useWebSocket(sessionId || '');

  const handleAnalyze = async (ingredients: string[]) => {
    reset();
    setAnalyzing(true);

    // Generate a temporary session ID to establish WebSocket connection BEFORE triggering HTTP request
    // This ensures we receive the initial research progress updates!
    const tempSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(tempSessionId);

    // Give the WebSocket connection a tiny head start (50ms) to connect
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const response = await api.post('/analysis/analyze', { 
        ingredients,
        session_id: tempSessionId
      });

      setAnalysis(response.data);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      const errMsg = error.response?.data?.detail || error?.message || "An unexpected error occurred while analyzing the ingredients.";
      toast({
        title: "Analysis Error",
        description: errMsg,
        variant: "destructive"
      });
      setSessionId(null);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-indigo-950 tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-indigo-600" />
            Safety Analysis
          </h2>
          <p className="text-zinc-500 mt-1 text-sm">
            Scan ingredients labels or paste raw text to run deep-agent safety compliance checks.
          </p>
        </div>
      </div>

      <ProgressBar />

      <IngredientInput onAnalyze={handleAnalyze} isLoading={isAnalyzing} />

      {/* <AgentWorkflowDiagram /> */}

      <AnalysisResults />
    </div>
  );
}
