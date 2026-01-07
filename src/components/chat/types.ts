export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface Message {
  role: "user" | "assistant" | "system" | "tool";
  text: string;
  timestamp?: Date;
  toolCalls?: ToolCall[];
  conversationId?: string;
  toolName?: string;
  status?: "awaiting_confirmation" | "complete" | "processing" | "listening" | "completed" | "COMPLETED" | "error" | "failed";
  interruptMessage?: string;
  imagePaths?: string[];
  formType?: "model-selection" | "optimization-config" | "optimization-result" | "optimization-inline";
  formData?: unknown;
  jobId?: string;
  job_id?: string;
  // Image/model fields - these come from SSE updates, not from text
  image_path?: string;
  img_url?: string;
  thumbnail_url?: string;
  model_url?: string;
  prompt?: string;
  generation_type?: string;
  type?: string;
  // Workflow chain fields
  chainId?: string;
  taskNumber?: number;
  seed?: number;
  model?: string;
}

export interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string, imageUrls?: string[], blobPaths?: string[], aiResponse?: unknown, uploadSessionId?: string) => void;
  onToolConfirmation?: (action: "confirm" | "modify" | "cancel", modifiedArgs?: Record<string, Record<string, unknown>>) => void;
  isGenerating?: boolean;
  apiUrl: string;
  onModelSelect?: (modelUrl: string, thumbnailUrl: string, workflow: string) => void;
  onImageGenerated?: () => void;
  onModelGenerated?: () => void;
  onOptimizationFormSubmit?: (type: string, data: unknown) => void;
  userEmail?: string;
  sessionId?: string;
  accessToken?: string;
}

export interface ParsedToolResponse {
  img_url?: string;
  thumbnail_url?: string;
  model_url?: string;
  job_id?: string;
  prompt?: string;
  filename?: string;
  status?: string;
  image_path?: string;
  type?: string;
  path?: string;
}

