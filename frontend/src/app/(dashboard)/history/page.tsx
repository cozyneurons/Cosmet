'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { History, Trash2, Calendar, FileText, ChevronRight, Award, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Custom Markdown parser for premium rendering in Dialog
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
        ? 'px-4 py-2 bg-indigo-50 border border-zinc-200 text-left font-bold text-indigo-900 text-xs'
        : 'px-4 py-2 border border-zinc-200 text-zinc-700 text-xs';
      const row = `<tr class="${!isHeader && tableRows.length % 2 === 0 ? 'bg-zinc-50' : 'bg-white'}">${cells.map(c => `<${cellTag} class="${cellClass}">${c}</${cellTag}>`).join('')}</tr>`;
      tableRows.push(row);
      lines[i] = '';
    } else {
      if (inTable) {
        inTable = false;
        const tableHtml = `<div class="overflow-x-auto my-4 border border-zinc-200 rounded-lg shadow-sm"><table class="min-w-full border-collapse text-left">${tableRows.join('')}</table></div>`;
        lines[i - 1] = tableHtml;
      }
    }
  }
  html = lines.filter(l => l !== '').join('\n');

  html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-semibold text-zinc-800 mt-4 mb-1">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-indigo-950 mt-6 mb-2 border-b border-zinc-150 pb-1.5">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-extrabold text-indigo-950 mt-8 mb-3">$1</h2>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-zinc-900">$1</strong>');
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="list-disc ml-5 my-1 text-zinc-700 text-xs leading-relaxed">$1</li>');
  html = html.replace(/\n/g, '<br>');
  return html;
}

export default function HistoryPage() {
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsFetching(true);
    try {
      const response = await api.get('/history/');
      setHistoryList(response.data.history || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Load Error",
        description: "Failed to fetch analysis history.",
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear your entire analysis history?")) return;
    setIsClearing(true);
    try {
      await api.delete('/history/');
      setHistoryList([]);
      toast({
        title: "History Cleared",
        description: "Your ingredient analysis log was successfully cleared.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Clear Error",
        description: "Failed to clear history. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsClearing(false);
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-indigo-950 tracking-tight flex items-center gap-2">
            <History className="h-8 w-8 text-indigo-600" />
            Analysis History
          </h2>
          <p className="text-zinc-500 mt-1 text-sm">
            Access previous compliance reports and safety assessments.
          </p>
        </div>
        {historyList.length > 0 && (
          <Button
            onClick={handleClearHistory}
            disabled={isClearing}
            variant="destructive"
            className="flex items-center gap-1.5 font-bold"
          >
            <Trash2 className="h-4 w-4" />
            {isClearing ? 'Clearing...' : 'Clear History'}
          </Button>
        )}
      </div>

      {isFetching ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : historyList.length === 0 ? (
        <Card className="bg-white border-zinc-200 p-8 text-center rounded-xl shadow-sm">
          <CardContent className="space-y-4 pt-6">
            <div className="bg-indigo-50 text-indigo-600 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto border border-indigo-100">
              <History className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-800">No History Found</h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              You haven't run any skincare ingredient compliance audits yet. Paste ingredients in the Analyze page to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {historyList.map((entry, index) => (
            <Card
              key={index}
              onClick={() => setSelectedEntry(entry)}
              className="bg-white border border-zinc-200 rounded-xl hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all duration-200"
            >
              <CardContent className="p-5 flex justify-between items-center gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs font-semibold text-zinc-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(entry.timestamp)}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                      <Award className="h-3.5 w-3.5" />
                      {(entry.research_confidence * 100).toFixed(0)}% Confidence
                    </span>
                    {entry.critic_approved && (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Critic Approved
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-zinc-800 truncate text-sm">
                    Ingredients: {entry.ingredient_names.join(', ')}
                  </h4>
                </div>
                <ChevronRight className="h-5 w-5 text-zinc-400 flex-shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {selectedEntry && (
        <Dialog open={selectedEntry !== null} onOpenChange={(open) => !open && setSelectedEntry(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white border border-zinc-250 p-6 rounded-xl">
            <DialogHeader className="border-b border-zinc-150 pb-4 mb-4">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
                <Calendar className="h-4 w-4" />
                {formatDate(selectedEntry.timestamp)}
              </div>
              <DialogTitle className="text-xl font-bold text-indigo-950">
                Analysis Report Details
              </DialogTitle>
              <DialogDescription className="text-zinc-500 font-medium">
                Ingredients: {selectedEntry.ingredient_names.join(', ')}
              </DialogDescription>
            </DialogHeader>
            <div className="prose max-w-none text-zinc-800 leading-relaxed text-xs">
              <div dangerouslySetInnerHTML={{ __html: parseMarkdown(selectedEntry.safety_analysis || '') }} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
