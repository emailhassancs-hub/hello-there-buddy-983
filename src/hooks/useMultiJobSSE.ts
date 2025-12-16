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
    console.log('\n' + '='.repeat(80));
    console.log('🎧 STARTING SSE MONITORING');
    console.log('='.repeat(80));
    console.log('Job ID:', jobId);
    console.log('Email:', email);
    console.log('API URL:', apiUrl);
    console.log('Timestamp:', new Date().toISOString());
    console.log('='.repeat(80));
    
    if (!jobId || !email) {
      console.error('❌ CANNOT START MONITORING - MISSING DATA');
      console.error('   jobId:', jobId);
      console.error('   email:', email);
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
    const sseUrl = `${apiUrl.replace(/\/+$/, '')}/generation-status/${jobId}/stream?email=${encodeURIComponent(email)}`;
    console.log('\n📡 SSE CONNECTION DETAILS:');
    console.log('   Full URL:', sseUrl);
    console.log('   Encoded email:', encodeURIComponent(email));
    
    const eventSource = new EventSource(sseUrl);
    eventSourcesRef.current.set(jobId, eventSource);
    
    console.log('✅ EventSource created');
    console.log('   ReadyState:', eventSource.readyState);
    console.log('   URL:', eventSource.url);
    
    eventSource.onopen = () => {
      console.log('\n' + '='.repeat(80));
      console.log('✅ SSE CONNECTION OPENED');
      console.log('='.repeat(80));
      console.log('Job ID:', jobId);
      console.log('ReadyState:', eventSource.readyState);
      console.log('Timestamp:', new Date().toISOString());
      console.log('='.repeat(80));
    };

    eventSource.onmessage = (event) => {
      console.log('\n' + '='.repeat(80));
      console.log('📨 SSE MESSAGE RECEIVED');
      console.log('='.repeat(80));
      console.log('Job ID:', jobId);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Raw event.data:', event.data);
      console.log('Event type:', event.type);
      console.log('Event lastEventId:', event.lastEventId);
      
      try {
        const data: SSEStatusData = JSON.parse(event.data);
        console.log('\n✅ PARSED SUCCESSFULLY');
        console.log('Parsed data:', JSON.stringify(data, null, 2));
        console.log('\n📊 DATA BREAKDOWN:');
        console.log('   job_id:', data.job_id);
        console.log('   status:', data.status);
        console.log('   timestamp:', data.timestamp);
        console.log('   data object exists?', !!data.data);
        
        if (data.data) {
          console.log('\n📦 DATA.DATA CONTENTS:');
          console.log('   Keys:', Object.keys(data.data));
          console.log('   image_path:', data.data.image_path);
          console.log('   model_url:', data.data.model_url);
          console.log('   type:', data.data.type);
        }

        // Call raw message callback for debugging
        console.log('\n📨 Calling onRawMessage callback...');
        onRawMessageRef.current?.(jobId, event.data, data);
        console.log('✅ onRawMessage called');

        const normalizedStatus = data.status?.toLowerCase();
        console.log('\n📊 Status Analysis:');
        console.log('   Original status:', data.status);
        console.log('   Normalized status:', normalizedStatus);

        if (normalizedStatus === 'listening') {
          console.log('\n⏳ Status: LISTENING - waiting for completion...');
        } else if (normalizedStatus === 'completed') {
          console.log('\n' + '='.repeat(80));
          console.log('✅ Status: COMPLETED!');
          console.log('='.repeat(80));
          
          const imageUrl = extractImageUrlFromSSE(data.data);
          console.log('🖼️  Extracted image URL:', imageUrl);
          
          if (imageUrl) {
            console.log('🖼️  IMAGE URL FOUND!');
            console.log('   URL:', imageUrl);
          } else {
            console.error('❌ NO IMAGE PATH IN COMPLETED MESSAGE!');
            console.error('   data.data:', data.data);
          }
          
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

          console.log('\n📞 CALLING handleJobComplete');
          console.log('   Args: jobId=', jobId, ', imageUrl=', imageUrl);
          onJobCompleteRef.current?.(jobId, imageUrl);
          console.log('✅ handleJobComplete called!');
          
          // Clean up
          console.log('🔌 Closing SSE connection...');
          eventSource.close();
          eventSourcesRef.current.delete(jobId);
          console.log('✅ SSE connection closed');
        } else if (normalizedStatus === 'error' || normalizedStatus === 'failed') {
          console.error('\n❌ Status: ERROR/FAILED');
          console.error('   Message:', data.message);
          
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
          console.log('\n⏳ Status: PROCESSING - job in progress...');
          setActiveJobs(prev => {
            const next = new Map(prev);
            const existing = next.get(jobId);
            if (existing) {
              next.set(jobId, { ...existing, status: 'processing' });
            }
            return next;
          });
        } else {
          console.log(`\n📊 Status: ${data.status} (unhandled)`);
        }
      } catch (err) {
        console.error('\n❌ PARSE ERROR');
        console.error('Error:', err);
        console.error('Stack:', (err as Error).stack);
        console.error('Raw data that failed to parse:', event.data);
      }
      
      console.log('='.repeat(80));
    };

    eventSource.onerror = (error) => {
      console.error('\n' + '='.repeat(80));
      console.error('❌ SSE ERROR');
      console.error('='.repeat(80));
      console.error('Job ID:', jobId);
      console.error('Error object:', error);
      console.error('ReadyState:', eventSource.readyState);
      console.error('ReadyState meanings:');
      console.error('   0 = CONNECTING');
      console.error('   1 = OPEN');
      console.error('   2 = CLOSED');
      console.error('Current state:', ['CONNECTING', 'OPEN', 'CLOSED'][eventSource.readyState]);
      console.error('Timestamp:', new Date().toISOString());
      console.error('='.repeat(80));
      
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
