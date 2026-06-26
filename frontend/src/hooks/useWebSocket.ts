import { useEffect, useRef } from 'react';
import { useAnalysisStore } from '@/store/analysisStore';

export const useWebSocket = (sessionId: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const { setProgress } = useAnalysisStore();
  
  useEffect(() => {
    if (!sessionId) return;
    
    const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    const wsUrl = `${wsBaseUrl}/api/v1/ws/${sessionId}`;
    console.log('[WS] Connecting to:', wsUrl);
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('[WS] Connected');
    };
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WS] Message received:', data);
        setProgress(data);
      } catch (err) {
        console.error('[WS] Failed to parse message:', err);
      }
    };
    
    wsRef.current.onerror = (error) => {
      console.error('[WS] Error:', error);
    };
    
    wsRef.current.onclose = (event) => {
      console.log('[WS] Disconnected:', event.code, event.reason);
    };
    
    return () => {
      if (wsRef.current) {
        console.log('[WS] Closing connection');
        wsRef.current.close();
      }
    };
  }, [sessionId, setProgress]);
  
  return wsRef.current;
};
