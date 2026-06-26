'use client';

import { useAnalysisStore } from '@/store/analysisStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, FileText, FileSpreadsheet, FileIcon as FilePdf } from 'lucide-react';
import { useState, memo } from 'react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

// Custom Markdown parser for premium rendering
function parseMarkdown(md: string) {
  if (!md) return '';

  let html = md;
  const lines = html.split('\n');
  let inTable = false;
  let tableRows: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      if (line.includes('---')) {
        lines[i] = '';
        continue;
      }
      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const isHeader = tableRows.length === 0;
      const cellTag = isHeader ? 'th' : 'td';
      const cellClass = isHeader
        ? 'px-4 py-3 bg-indigo-50 border border-zinc-200 text-left font-bold text-indigo-900 text-sm'
        : 'px-4 py-2 border border-zinc-200 text-zinc-700 text-sm';
      const row = `<tr class="${!isHeader && tableRows.length % 2 === 0 ? 'bg-zinc-50' : 'bg-white'}">${cells.map(c => `<${cellTag} class="${cellClass}">${c}</${cellTag}>`).join('')}</tr>`;
      tableRows.push(row);
      lines[i] = '';
    } else {
      if (inTable) {
        inTable = false;
        const tableHtml = `<div class="overflow-x-auto my-6 border border-zinc-200 rounded-lg shadow-sm"><table class="min-w-full border-collapse text-left">${tableRows.join('')}</table></div>`;
        lines[i - 1] = tableHtml;
      }
    }
  }
  html = lines.filter(l => l !== '').join('\n');

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h4 class="text-base font-semibold text-zinc-800 mt-5 mb-2">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="text-xl font-bold text-indigo-950 mt-8 mb-4 border-b border-zinc-150 pb-2">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 class="text-2xl font-extrabold text-indigo-950 mt-10 mb-5">$1</h2>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-zinc-900">$1</strong>');

  // Bullet points
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="list-disc ml-6 my-1.5 text-zinc-700 leading-relaxed">$1</li>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}

const AnalysisResults = memo(function AnalysisResults() {
  const { currentAnalysis, isAnalyzing } = useAnalysisStore();
  const [exporting, setExporting] = useState<string | null>(null);
  const { toast } = useToast();

  if (isAnalyzing) {
    return (
      <Card className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-zinc-200 overflow-hidden mt-8">
        <CardHeader className="bg-zinc-50 border-b border-zinc-100 px-6 py-4">
          <div className="space-y-2 w-full">
            <Skeleton className="h-6 w-1/3 bg-zinc-200" />
            <Skeleton className="h-4 w-1/2 bg-zinc-200" />
          </div>
        </CardHeader>
        <CardContent className="px-8 py-6 space-y-4">
          <Skeleton className="h-4 w-full bg-zinc-200" />
          <Skeleton className="h-4 w-5/6 bg-zinc-200" />
          <Skeleton className="h-4 w-4/5 bg-zinc-200" />
          <Skeleton className="h-32 w-full bg-zinc-100 rounded-lg mt-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-zinc-100">
            <Skeleton className="h-12 bg-zinc-100 rounded" />
            <Skeleton className="h-12 bg-zinc-100 rounded" />
            <Skeleton className="h-12 bg-zinc-100 rounded" />
            <Skeleton className="h-12 bg-zinc-100 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentAnalysis) return null;

  const handleExport = async (format: 'txt' | 'pdf' | 'csv') => {
    setExporting(format);
    try {
      const response = await api.get(
        `/analysis/export/${format}?session_id=${currentAnalysis.session_id}`,
        {
          responseType: 'blob',
        }
      );

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `safety_report_${currentAnalysis.session_id.substring(0, 8)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Export Complete",
        description: `Successfully exported report as ${format.toUpperCase()}!`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Export Failed",
        description: `Failed to export as ${format.toUpperCase()}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setExporting(null);
    }
  };

  const duration = currentAnalysis.analysis_end_time && currentAnalysis.analysis_start_time
    ? Math.round((new Date(currentAnalysis.analysis_end_time).getTime() - new Date(currentAnalysis.analysis_start_time).getTime()) / 1000)
    : 0;

  const formattedHtml = parseMarkdown(currentAnalysis.safety_analysis);

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-zinc-200 overflow-hidden mt-8">
      <CardHeader className="bg-zinc-50 border-b border-zinc-100 px-6 py-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold text-zinc-800">Safety Analysis Report</CardTitle>
          <CardDescription>Generated by Cosmix multi-agent workflow</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleExport('txt')}
            disabled={exporting !== null}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 bg-white"
          >
            <FileText className="h-4 w-4 text-zinc-500" />
            TXT
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 bg-white"
          >
            <FilePdf className="h-4 w-4 text-red-500" />
            PDF
          </Button>
          <Button
            onClick={() => handleExport('csv')}
            disabled={exporting !== null}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 bg-white"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-8 py-6 space-y-6">
        {/* Rendered Safety Report */}
        <div className="prose max-w-none text-zinc-800 leading-relaxed text-sm">
          <div dangerouslySetInnerHTML={{ __html: formattedHtml }} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-zinc-100">
          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Analysis Duration</p>
            <p className="text-lg font-bold text-zinc-800 mt-1">{duration}s</p>
          </div>
          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Confidence Level</p>
            <p className="text-lg font-bold text-indigo-600 mt-1">{(currentAnalysis.research_confidence * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Research Agents</p>
            <p className="text-lg font-bold text-zinc-800 mt-1">{currentAnalysis.research_attempts} attempts</p>
          </div>
          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Knowledge Base Hits</p>
            <p className="text-lg font-bold text-zinc-800 mt-1">{currentAnalysis.qdrant_hits} hits</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default AnalysisResults;
