import { useEffect, useRef, useState, useCallback } from 'react';

export interface SSEStatusUpdate {
  job_id: string;
  status: 'listening' | 'processing' | 'completed' | 'error' | 'failed' | 'timeout';
  message?: string;
  [key: string]: any; // Allow additional fields from backend
}

export interface UseSSEOptions {
  apiUrl: string;
  jobId: string | null;
  email?: string;
  enabled?: boolean;
  onStatusUpdate?: (update: SSEStatusUpdate) => void;
  onError?: (error: Event) => void;
  onComplete?: (finalStatus: SSEStatusUpdate) => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

export function useSSE({
  apiUrl,
  jobId,
  email,
  enabled = true,
  onStatusUpdate,
  onError,
  onComplete,
  // autoReconnect and reconnectDelay are kept for backward compatibility but not used
  autoReconnect,
  reconnectDelay,
}: UseSSEOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const hasAttemptedConnectionRef = useRef(false); // Track if we've already attempted connection
  const previousJobIdRef = useRef<string | null>(null); // Track previous jobId to detect changes

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Check if endpoint exists before connecting
  const checkEndpointExists = useCallback(async (url: string): Promise<boolean> => {
    try {
      // Use AbortController to timeout the request quickly
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      try {
        // Try HEAD first (lightweight, doesn't consume stream)
        const response = await fetch(url, {
          method: 'HEAD',
          mode: 'cors',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // If endpoint returns 404, it doesn't exist
        if (response.status === 404) {
          console.warn(`[SSE] Endpoint not found (404): ${url}`);
          return false;
        }
        
        // 405 (Method Not Allowed) means endpoint exists but doesn't support HEAD
        // This is common for SSE endpoints - treat as "exists"
        if (response.status === 405) {
          return true;
        }
        
        // For other status codes (200, etc.), endpoint exists
        return true;
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        
        // If aborted due to timeout, assume endpoint might exist (let EventSource try)
        if (fetchErr.name === 'AbortError') {
          console.warn(`[SSE] Endpoint check timed out: ${url} - will attempt connection`);
          return true;
        }
        throw fetchErr;
      }
    } catch (err: any) {
      // Network errors or other issues - assume endpoint might exist, let EventSource try
      // This is safer than blocking potentially valid connections
      console.warn(`[SSE] Could not verify endpoint: ${url}`, err?.message || err);
      return true; // Allow connection attempt
    }
  }, []);

  const connect = useCallback(async () => {
    console.log('trying to connect==========>>>')
    // Don't connect if disabled, no jobId, already connected, or already attempted
    if (!enabled || !jobId || eventSourceRef.current || hasAttemptedConnectionRef.current) {
      return;
    }

    // Mark that we've attempted connection IMMEDIATELY to prevent concurrent calls
    hasAttemptedConnectionRef.current = true;

    // Build SSE URL
    const url = new URL(`${apiUrl}/generation-status/${jobId}/stream`);
    if (email) {
      url.searchParams.set('email', email);
    }

    console.log(`[SSE] Connecting to: ${url.toString()}`);

    // Check if endpoint exists before creating EventSource (one-time check)
    const endpointExists = await checkEndpointExists(url.toString());
    if (!endpointExists) {
      const errorMessage = `[SSE] Endpoint not found (404) for job ${jobId}. Job may not exist or endpoint path is incorrect.`;
      console.error(errorMessage);
      
      // Create a plain object that mimics EventSource error event
      // We can't modify Event.target directly, so create a custom object
      const syntheticError = {
        type: 'error',
        target: { readyState: EventSource.CLOSED },
        isTrusted: false,
      } as unknown as Event;
      
      setError(syntheticError);
      setIsConnected(false);
      onError?.(syntheticError);
      
      // Stop - no retry
      cleanup();
      return;
    }

    try {
      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[SSE] Connection opened');
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
            console.log('event==========>>>',event);
          const data: SSEStatusUpdate = JSON.parse(event.data);
          
          // onStatusUpdate?.(data);
          // onStatusUpdate?.(data);
          // Check if job is complete
          console.log('data.status==========>>>',data.status)
          if (data.status.toLocaleLowerCase() === 'completed' || data.status.toLocaleLowerCase() === 'error' || data.status.toLocaleLowerCase() === 'failed') {
            console.log('[SSE] Received update:', data);
            onComplete?.(data);
            // Close connection when job completes
            cleanup();
          }
        } catch (err) {
          console.error('[SSE] Failed to parse message:', err, event.data);
        }
      };

      eventSource.onerror = (err) => {
        const eventSource = err.target as EventSource;
        const readyState = eventSource?.readyState;
        
        console.error('[SSE] Connection error:', err, `ReadyState: ${readyState}`);
        console.error('[SSE] Connection failed. No retry will be attempted.');
        
        setError(err);
        setIsConnected(false);
        onError?.(err);
        
        // Just cleanup - no retry
        cleanup();
      };
    } catch (err) {
      console.error('[SSE] Failed to create EventSource:', err);
      setError(err as Event);
      hasAttemptedConnectionRef.current = true; // Mark as attempted even on failure
    }
  }, [apiUrl, jobId, email, enabled, onStatusUpdate, onError, onComplete, cleanup, checkEndpointExists]);

  // Connect when jobId changes or component mounts
  useEffect(() => {
    // Only reset attempt flag if jobId actually changed
    if (previousJobIdRef.current !== jobId) {
      hasAttemptedConnectionRef.current = false;
      previousJobIdRef.current = jobId;
    }
    
    if (enabled && jobId && !hasAttemptedConnectionRef.current) {
      connect();
    }

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, jobId]); // Only depend on enabled and jobId, not the callback functions

  // Manual reconnect function
  const reconnect = useCallback(() => {
    cleanup();
    hasAttemptedConnectionRef.current = false; // Reset attempt flag on manual reconnect
    connect();
  }, [cleanup, connect]);

  // Manual disconnect function
  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
    isConnected,
    error,
    reconnect,
    disconnect,
  };
}

