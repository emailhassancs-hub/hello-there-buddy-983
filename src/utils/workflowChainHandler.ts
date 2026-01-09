// ============================================
// WORKFLOW CHAIN HANDLER UTILITIES
// ============================================

export interface WorkflowChainData {
  chain_id: string;
  total_tasks: number;
  stream_url: string;
}

export interface ChainEvent {
  type?: string;
  status?: string;
  task_number?: number;
  total_tasks?: number;
  prompt?: string;
  task_type?: string;
  job_id?: string;
  image_path?: string;
  model_url?: string;
  error?: string;
  outputs?: any;
  [key: string]: any;
}

export interface ChainResults {
  images: string[];
  models: string[];
  allOutputs: Record<string, any>;
}

export interface ChainEventHandlers {
  onTaskStarting?: (event: ChainEvent) => void;
  onTaskStarted?: (event: ChainEvent) => void;
  onTaskCompleted?: (event: ChainEvent) => void;
  onChainCompleted?: (event: ChainEvent) => void;
  onTaskFailed?: (event: ChainEvent) => void;
  onStatusUpdate?: (message: string) => void;
  onProgressUpdate?: (current: number, total: number) => void;
  onError?: (error: string) => void;
  onLoaderToggle?: (show: boolean) => void;
}

/**
 * Parses and handles workflow chain events from SSE stream
 */
export function handleChainEvent(
  event: ChainEvent,
  eventSource: EventSource,
  results: ChainResults,
  totalTasks: number,
  handlers: ChainEventHandlers
): void {
  const eventType = event.type;

  switch (eventType) {
    // ----------------------------------------
    // Initial connection
    // ----------------------------------------
    case undefined:
      if (event.status === "listening") {
        console.log("🎧 SSE listening...");
        handlers.onStatusUpdate?.("Connected. Processing workflow...");
      }
      break;

    // ----------------------------------------
    // Task is starting
    // ----------------------------------------
    case "task_starting":
      console.log(`⚡ Task ${event.task_number}/${event.total_tasks} starting`);
      handlers.onStatusUpdate?.(
        `⚡ Task ${event.task_number}/${event.total_tasks}: ${event.prompt || event.task_type}`
      );
      handlers.onProgressUpdate?.(event.task_number - 1, event.total_tasks);
      handlers.onTaskStarting?.(event);
      break;

    // ----------------------------------------
    // Job ID assigned (processing)
    // ----------------------------------------
    case "job_started":
      console.log(`🎧 Job started: ${event.job_id}`);
      handlers.onStatusUpdate?.(
        `🎧 Processing task ${event.task_number}/${event.total_tasks}...`
      );
      handlers.onTaskStarted?.(event);
      break;

    // ----------------------------------------
    // Individual task completed
    // ----------------------------------------
    case "task_completed":
      console.log(`✅ Task ${event.task_number}/${event.total_tasks} completed!`);
      
      handlers.onStatusUpdate?.(
        `✅ Task ${event.task_number}/${event.total_tasks} completed!`
      );
      handlers.onProgressUpdate?.(event.task_number, event.total_tasks);

      // Store the result
      if (event.image_path) {
        results.images.push(event.image_path);
      }
      
      if (event.model_url) {
        results.models.push(event.model_url);
      }

      // Store in outputs
      results.allOutputs[`task_${event.task_number}`] = {
        job_id: event.job_id,
        image_path: event.image_path,
        model_url: event.model_url,
        status: event.status,
      };

      handlers.onTaskCompleted?.(event);
      // ⚠️ DON'T close SSE here - more tasks may be coming!
      break;

    // ----------------------------------------
    // ALL tasks completed - Chain finished!
    // ----------------------------------------
    case "chain_completed":
      console.log("🎉 Chain completed!");
      
      handlers.onLoaderToggle?.(false);
      handlers.onProgressUpdate?.(event.total_tasks || totalTasks, totalTasks);
      handlers.onStatusUpdate?.(
        `🎉 All ${event.total_tasks || totalTasks} tasks completed successfully!`
      );

      handlers.onChainCompleted?.(event);

      // ✅ NOW close the SSE connection
      eventSource.close();
      break;

    // ----------------------------------------
    // Task failed
    // ----------------------------------------
    case "task_failed":
      console.error(`❌ Task ${event.task_number} failed:`, event.error);
      
      handlers.onLoaderToggle?.(false);
      handlers.onError?.(
        `Task ${event.task_number} failed: ${event.error || "Unknown error"}`
      );

      // Close SSE connection
      eventSource.close();
      break;

    // ----------------------------------------
    // Unknown event type
    // ----------------------------------------
    default:
      console.log("📢 Unknown event type:", eventType, event);
      
      // Handle legacy status updates
      if (event.status === "COMPLETED" && event.image_path) {
        console.log("🖼️ Legacy image result:", event.image_path);
      }
  }
}

/**
 * Initializes and manages the SSE connection for a workflow chain
 */
export function createChainSSEConnection(
  streamUrl: string,
  totalTasks: number,
  handlers: ChainEventHandlers
): EventSource {
  const results: ChainResults = {
    images: [],
    models: [],
    allOutputs: {},
  };

  console.log(`🔗 Opening SSE connection to: ${streamUrl}`);

  const eventSource = new EventSource(streamUrl);

  eventSource.onopen = () => {
    console.log("✅ SSE Connection opened for chain");
  };

  eventSource.onmessage = (event) => {
    try {
      const update: ChainEvent = JSON.parse(event.data);
      console.log("📢 Chain SSE Event:", update);
      handleChainEvent(update, eventSource, results, totalTasks, handlers);
    } catch (err) {
      console.error("❌ Failed to parse SSE event:", err, event.data);
    }
  };

  eventSource.onerror = (error) => {
    console.error("❌ SSE Error:", error);
    handlers.onLoaderToggle?.(false);
    handlers.onError?.("Connection lost. Please refresh the page.");
    eventSource.close();
  };

  return eventSource;
}

/**
 * Formats workflow chain summary for display
 */
export function formatChainSummary(results: ChainResults): {
  imageCount: number;
  modelCount: number;
  images: string[];
  models: string[];
} {
  return {
    imageCount: results.images.length,
    modelCount: results.models.length,
    images: results.images,
    models: results.models,
  };
}
