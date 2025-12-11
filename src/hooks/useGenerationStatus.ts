import { useState, useEffect, useCallback, useRef } from 'react';
import { GenerationStatusStream, GenerationStatus } from '@/utils/generationStatusStream';

interface UseGenerationStatusResult {
  status: GenerationStatus | null;
  isComplete: boolean;
  error: string | null;
  completedData: any | null;
  disconnect: () => void;
}

/**
 * React hook for real-time generation status updates
 * 
 * @example
 * const { status, isComplete, error, completedData } = useGenerationStatus(jobId, email, apiUrl);
 */
export function useGenerationStatus(
  jobId: string | null,
  email: string,
  apiUrl: string = 'http://localhost:8000'
): UseGenerationStatusResult {
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedData, setCompletedData] = useState<any | null>(null);
  const streamRef = useRef<GenerationStatusStream | null>(null);

  const disconnect = useCallback(() => {
    streamRef.current?.disconnect();
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!jobId || !email) return;

    // Reset state for new job
    setStatus(null);
    setIsComplete(false);
    setError(null);
    setCompletedData(null);

    // Create new stream
    const statusStream = new GenerationStatusStream(jobId, email, apiUrl);
    streamRef.current = statusStream;

    // Connect and listen
    statusStream.connect(
      // On update
      (newStatus) => {
        setStatus(newStatus);
      },
      // On complete
      (data) => {
        setIsComplete(true);
        setCompletedData(data);
      },
      // On error
      (errorMsg) => {
        setError(errorMsg);
      }
    );

    // Cleanup on unmount or jobId change
    return () => {
      statusStream.disconnect();
    };
  }, [jobId, email, apiUrl]);

  return {
    status,
    isComplete,
    error,
    completedData,
    disconnect,
  };
}
