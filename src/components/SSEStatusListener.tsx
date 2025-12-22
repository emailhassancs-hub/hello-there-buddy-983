import { useEffect, useState, useCallback } from 'react';
import { useSSE, SSEStatusUpdate } from '@/hooks/useSSE';
import { useToast } from '@/hooks/use-toast';

interface ActiveJob {
  jobId: string;
  status: SSEStatusUpdate | null;
  isConnected: boolean;
}

interface SSEStatusListenerProps {
  apiUrl: string;
  email?: string;
  activeJobIds: string[];
  onStatusUpdate?: (jobId: string, update: SSEStatusUpdate) => void;
  onJobComplete?: (jobId: string, finalStatus: SSEStatusUpdate) => void;
}

/**
 * Component that manages SSE connections for multiple generation jobs
 * Automatically connects/disconnects as job IDs are added/removed
 */
export function SSEStatusListener({
  apiUrl,
  email,
  activeJobIds,
  onStatusUpdate,
  onJobComplete,
}: SSEStatusListenerProps) {
  const [activeJobs, setActiveJobs] = useState<Map<string, ActiveJob>>(new Map());
  const { toast } = useToast();

  // Update active jobs when jobIds change
  useEffect(() => {
    setActiveJobs((prev) => {
      const updated = new Map(prev);
      
      // Add new jobs
      activeJobIds.forEach((jobId) => {
        if (!updated.has(jobId)) {
          updated.set(jobId, {
            jobId,
            status: null,
            isConnected: false,
          });
        }
      });
      
      // Remove jobs that are no longer active
      Array.from(updated.keys()).forEach((jobId) => {
        if (!activeJobIds.includes(jobId)) {
          updated.delete(jobId);
        }
      });
      
      return updated;
    });
  }, [activeJobIds]);

  return (
    <>
      {Array.from(activeJobs.values()).map((job) => (
        <SSEConnection
          key={job.jobId}
          apiUrl={apiUrl}
          email={email}
          jobId={job.jobId}
          onStatusUpdate={(update) => {
            setActiveJobs((prev) => {
              const updated = new Map(prev);
              const jobData = updated.get(job.jobId);
              if (jobData) {
                updated.set(job.jobId, {
                  ...jobData,
                  status: update,
                  isConnected: true,
                });
              }
              return updated;
            });
            onStatusUpdate?.(job.jobId, update);
          }}
          onComplete={(finalStatus) => {
            setActiveJobs((prev) => {
              const updated = new Map(prev);
              updated.delete(job.jobId);
              return updated;
            });
            onJobComplete?.(job.jobId, finalStatus);
          }}
          onError={(error) => {
            console.error(`[SSE] Error for job ${job.jobId}:`, error);
            setActiveJobs((prev) => {
              const updated = new Map(prev);
              const jobData = updated.get(job.jobId);
              if (jobData) {
                updated.set(job.jobId, {
                  ...jobData,
                  isConnected: false,
                });
              }
              return updated;
            });
          }}
        />
      ))}
    </>
  );
}

interface SSEConnectionProps {
  apiUrl: string;
  email?: string;
  jobId: string;
  onStatusUpdate: (update: SSEStatusUpdate) => void;
  onComplete: (finalStatus: SSEStatusUpdate) => void;
  onError: (error: Event) => void;
}

function SSEConnection({
  apiUrl,
  email,
  jobId,
  onStatusUpdate,
  onComplete,
  onError,
}: SSEConnectionProps) {
  const { status, isConnected, error } = useSSE({
    apiUrl,
    jobId,
    email,
    enabled: true,
    onStatusUpdate,
    onComplete,
    onError,
    autoReconnect: true,
  });

  return null; // This component doesn't render anything
}

