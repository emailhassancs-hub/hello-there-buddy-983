/**
 * Real-time generation status stream using Server-Sent Events
 * Replaces polling with instant push notifications
 */

export interface GenerationStatus {
  job_id: string;
  status: 'listening' | 'processing' | 'completed' | 'error' | 'failed' | 'timeout';
  message?: string;
  data?: any;
  timestamp?: string;
}

export type StatusCallback = (status: GenerationStatus) => void;

export class GenerationStatusStream {
  private eventSource: EventSource | null = null;
  private jobId: string;
  private email: string;
  private baseUrl: string;

  constructor(jobId: string, email: string, baseUrl: string = 'http://localhost:8000') {
    this.jobId = jobId;
    this.email = email;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Connect to SSE stream and listen for updates
   */
  connect(
    onUpdate: StatusCallback,
    onComplete: (data: any) => void,
    onError: (error: string) => void
  ): void {
    // Close existing connection if any
    this.disconnect();

    // Create SSE connection
    const url = `${this.baseUrl}/generation-status/${this.jobId}/stream?email=${encodeURIComponent(this.email)}`;
    this.eventSource = new EventSource(url);

    console.log(`🎧 Connecting to generation status stream: ${this.jobId}`);

    // Handle incoming messages
    this.eventSource.onmessage = (event) => {
      try {
        const status: GenerationStatus = JSON.parse(event.data);
        console.log('📨 Status update:', status);

        // Call update callback
        onUpdate(status);

        // Handle completion
        if (status.status === 'completed') {
          console.log('✅ Generation completed!');
          onComplete(status.data);
          this.disconnect();
        }

        // Handle errors
        if (status.status === 'error' || status.status === 'failed') {
          console.error('❌ Generation failed:', status.message);
          onError(status.message || 'Generation failed');
          this.disconnect();
        }

        // Handle timeout
        if (status.status === 'timeout') {
          console.warn('⏱️ Stream timeout');
          onError('Generation timeout - please check status manually');
          this.disconnect();
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    // Handle connection errors
    this.eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error);
      onError('Connection lost - please refresh');
      this.disconnect();
    };

    // Auto-disconnect after 10 minutes (safety)
    setTimeout(() => {
      if (this.eventSource?.readyState !== EventSource.CLOSED) {
        console.log('⏱️ Auto-disconnecting after 10 minutes');
        onError('Stream timeout');
        this.disconnect();
      }
    }, 600000);
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect(): void {
    if (this.eventSource) {
      console.log('🔌 Disconnecting from generation status stream');
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}
