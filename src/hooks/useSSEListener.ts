import { useEffect, useRef, useCallback } from 'react';

export interface SSEStatusData {
  job_id: string;
  status: 'listening' | 'processing' | 'COMPLETED' | 'completed' | 'error' | 'failed' | 'timeout';
  message?: string;
  data?: {
    image_path?: string;
    imageUrl?: string;
    image_url?: string;
    resultUrl?: string;
    result_url?: string;
    url?: string;
    [key: string]: any;
  };
  timestamp?: string;
}

export type SSECallback = (data: SSEStatusData) => void;

/**
 * Custom hook for SSE-based real-time generation status updates
 * 
 * @param jobId - The job ID to monitor
 * @param email - User email for authentication
 * @param onUpdate - Callback for status updates
 * @param apiUrl - Base API URL
 */
export function useSSEListener(
  jobId: string | null,
  email: string,
  onUpdate: SSECallback,
  apiUrl: string = 'http://localhost:8000'
) {
  const eventSourceRef = useRef<EventSource | null>(null);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('🔌 Disconnecting SSE for job:', jobId);
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId || !email) return;

    // Clean up any existing connection
    disconnect();

    const url = `${apiUrl.replace(/\/+$/, '')}/generation-status/${jobId}/stream?email=${encodeURIComponent(email)}`;
    console.log(`🎧 Connecting to SSE stream: ${url}`);

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: SSEStatusData = JSON.parse(event.data);
        console.log('📨 SSE Status update:', data);

        onUpdate(data);

        // Close connection on terminal states
        const normalizedStatus = data.status?.toLowerCase();
        if (normalizedStatus === 'completed' || normalizedStatus === 'error' || normalizedStatus === 'failed') {
          console.log(`✅ SSE complete for job ${jobId}, status: ${data.status}`);
          eventSource.close();
          eventSourceRef.current = null;
        }
      } catch (err) {
        console.error('❌ Failed to parse SSE message:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error);
      eventSource.close();
      eventSourceRef.current = null;
    };

    // Auto-cleanup after 10 minutes
    const timeoutId = setTimeout(() => {
      if (eventSourceRef.current?.readyState !== EventSource.CLOSED) {
        console.log('⏱️ SSE timeout for job:', jobId);
        eventSource.close();
        eventSourceRef.current = null;
      }
    }, 600000);

    return () => {
      clearTimeout(timeoutId);
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [jobId, email, apiUrl, onUpdate, disconnect]);

  return { disconnect };
}

/**
 * Extract image URL from SSE response data
 */
export function extractImageUrlFromSSE(data: SSEStatusData['data']): string | null {
  if (!data) return null;
  
  // Check common field names
  if (data.image_path) return data.image_path;
  if (data.imageUrl) return data.imageUrl;
  if (data.image_url) return data.image_url;
  if (data.resultUrl) return data.resultUrl;
  if (data.result_url) return data.result_url;
  if (data.url) return data.url;
  
  // Try to find any URL in the data
  const jsonStr = JSON.stringify(data);
  const urlMatch = jsonStr.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|webp|gif)/i);
  if (urlMatch) return urlMatch[0];
  
  return null;
}
