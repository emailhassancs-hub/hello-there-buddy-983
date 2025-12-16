import { useState, useCallback, useRef, useEffect } from 'react';
import { SSEStatusData, extractImageUrlFromSSE } from './useSSEListener';

export interface JobStatus {
  jobId: string;
  status: 'processing' | 'completed' | 'error' | 'failed';
  imageUrl?: string;
  message?: string;
  timestamp: Date;
}

interface UseMultiJobSSEOptions {
  email: string;
  apiUrl?: string;
  onJobComplete?: (jobId: string, imageUrl: string | null) => void;
  onJobError?: (jobId: string, error: string) => void;
  onRawMessage?: (jobId: string, rawData: string, parsedData: any) => void;
}

/**
 * Hook for managing multiple concurrent SSE connections for job tracking
 */
export function useMultiJobSSE({
  email,
  apiUrl = 'http://localhost:8000',
  onJobComplete,
  onJobError,
  onRawMessage,
}: UseMultiJobSSEOptions) {
  const [activeJobs, setActiveJobs] = useState<Map<string, JobStatus>>(new Map());
  const eventSourcesRef = useRef<Map<string, EventSource>>(new Map());
  
  // Use refs to always have access to latest callbacks
  const onJobCompleteRef = useRef(onJobComplete);
  const onJobErrorRef = useRef(onJobError);
  const onRawMessageRef = useRef(onRawMessage);
  
  // Keep refs updated
  useEffect(() => {
    onJobCompleteRef.current = onJobComplete;
    onJobErrorRef.current = onJobError;
    onRawMessageRef.current = onRawMessage;
  }, [onJobComplete, onJobError, onRawMessage]);

  // Start monitoring a job
  const startMonitoring = useCallback((jobId: string) => {
    console.log(`🎯 ========== startMonitoring CALLED ==========`);
    console.log(`🎯 Job ID: ${jobId}`);
    console.log(`🎯 Email: ${email}`);
    console.log(`🎯 API URL: ${apiUrl}`);
    
    if (!jobId || !email) {
      console.log(`❌ Cannot start monitoring - jobId: ${jobId}, email: ${email}`);
      return;
    }
    
    // Check if already monitoring
    if (eventSourcesRef.current.has(jobId)) {
      console.log(`⚠️ Already monitoring job: ${jobId}`);
      return;
    }

    console.log(`🎯 Starting SSE monitoring for job: ${jobId}`);

    // Add to active jobs with processing status
    setActiveJobs(prev => {
      const next = new Map(prev);
      next.set(jobId, {
        jobId,
        status: 'processing',
        timestamp: new Date(),
      });
      return next;
    });

    // Create SSE connection
    const url = `${apiUrl.replace(/\/+$/, '')}/generation-status/${jobId}/stream?email=${encodeURIComponent(email)}`;
    console.log(`🎧 SSE URL: ${url}`);
    
    const eventSource = new EventSource(url);
    eventSourcesRef.current.set(jobId, eventSource);
    
    eventSource.onopen = () => {
      console.log(`✅ SSE CONNECTION OPENED for job: ${jobId}`);
    };

    eventSource.onmessage = (event) => {
      try {
        console.log(`📨 ========== SSE MESSAGE RECEIVED ==========`);
        console.log(`📨 Job ID: ${jobId}`);
        console.log(`📨 Raw event.data:`, event.data);
        
        const data: SSEStatusData = JSON.parse(event.data);
        console.log(`📨 Parsed status:`, data.status);
        console.log(`📨 Parsed data:`, data.data);

        // Call raw message callback for debugging
        console.log(`📨 Calling onRawMessage...`);
        onRawMessageRef.current?.(jobId, event.data, data);

        const normalizedStatus = data.status?.toLowerCase();
        console.log(`📨 Normalized status:`, normalizedStatus);

        if (normalizedStatus === 'completed') {
          console.log(`✅ ========== JOB COMPLETED ==========`);
          const imageUrl = extractImageUrlFromSSE(data.data);
          console.log(`✅ Extracted image URL:`, imageUrl);
          
          setActiveJobs(prev => {
            const next = new Map(prev);
            next.set(jobId, {
              jobId,
              status: 'completed',
              imageUrl: imageUrl || undefined,
              timestamp: new Date(),
            });
            return next;
          });

          console.log(`✅ Calling onJobComplete with jobId=${jobId}, imageUrl=${imageUrl}`);
          onJobCompleteRef.current?.(jobId, imageUrl);
          console.log(`✅ onJobComplete called!`);
          
          // Clean up
          eventSource.close();
          eventSourcesRef.current.delete(jobId);
        } else if (normalizedStatus === 'error' || normalizedStatus === 'failed') {
          setActiveJobs(prev => {
            const next = new Map(prev);
            next.set(jobId, {
              jobId,
              status: 'error',
              message: data.message || 'Generation failed',
              timestamp: new Date(),
            });
            return next;
          });

          onJobErrorRef.current?.(jobId, data.message || 'Generation failed');
          
          // Clean up
          eventSource.close();
          eventSourcesRef.current.delete(jobId);
        } else if (normalizedStatus === 'processing') {
          setActiveJobs(prev => {
            const next = new Map(prev);
            const existing = next.get(jobId);
            if (existing) {
              next.set(jobId, { ...existing, status: 'processing' });
            }
            return next;
          });
        }
      } catch (err) {
        console.error(`❌ Failed to parse SSE for job ${jobId}:`, err);
      }
    };

    eventSource.onerror = () => {
      console.error(`❌ SSE error for job ${jobId}`);
      eventSource.close();
      eventSourcesRef.current.delete(jobId);
      
      setActiveJobs(prev => {
        const next = new Map(prev);
        next.set(jobId, {
          jobId,
          status: 'error',
          message: 'Connection lost',
          timestamp: new Date(),
        });
        return next;
      });
      
      onJobErrorRef.current?.(jobId, 'Connection lost');
    };

    // Auto-timeout after 10 minutes
    setTimeout(() => {
      if (eventSourcesRef.current.has(jobId)) {
        console.log(`⏱️ Timeout for job ${jobId}`);
        eventSourcesRef.current.get(jobId)?.close();
        eventSourcesRef.current.delete(jobId);
        
        setActiveJobs(prev => {
          const next = new Map(prev);
          const existing = next.get(jobId);
          if (existing && existing.status === 'processing') {
            next.set(jobId, {
              ...existing,
              status: 'error',
              message: 'Generation timed out',
            });
          }
          return next;
        });
      }
    }, 600000);
  }, [email, apiUrl]);

  // Stop monitoring a job
  const stopMonitoring = useCallback((jobId: string) => {
    const eventSource = eventSourcesRef.current.get(jobId);
    if (eventSource) {
      eventSource.close();
      eventSourcesRef.current.delete(jobId);
    }
    setActiveJobs(prev => {
      const next = new Map(prev);
      next.delete(jobId);
      return next;
    });
  }, []);

  // Stop all monitoring
  const stopAll = useCallback(() => {
    eventSourcesRef.current.forEach(es => es.close());
    eventSourcesRef.current.clear();
    setActiveJobs(new Map());
  }, []);

  // Clear completed/errored jobs from display
  const clearJob = useCallback((jobId: string) => {
    setActiveJobs(prev => {
      const next = new Map(prev);
      next.delete(jobId);
      return next;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventSourcesRef.current.forEach(es => es.close());
      eventSourcesRef.current.clear();
    };
  }, []);

  const processingJobs = Array.from(activeJobs.values()).filter(j => j.status === 'processing');

  return {
    activeJobs,
    processingJobs,
    startMonitoring,
    stopMonitoring,
    stopAll,
    clearJob,
    isProcessing: processingJobs.length > 0,
  };
}
