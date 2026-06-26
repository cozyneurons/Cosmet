'use client';

import { useAnalysisStore } from '@/store/analysisStore';

export default function ProgressBar() {
  const { progress } = useAnalysisStore();

  if (!progress) return null;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-5 rounded-xl shadow-sm border border-zinc-200 space-y-3 mb-6">
      <div className="flex justify-between items-center text-sm">
        <span className="font-semibold text-indigo-600">{progress.message}</span>
        <span className="text-zinc-500 font-bold">{progress.progress}%</span>
      </div>
      <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden border border-zinc-200">
        <div
          className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress.progress}%` }}
        />
      </div>
      <div className="text-xs text-zinc-400 text-center">
        Workflow executing multi-agent validation. Please wait.
      </div>
    </div>
  );
}
