// Chat History API - Dedicated API layer for conversation sessions
const CHAT_API_URL = "https://games-ai-studio-middleware-agentic-main-347148155332.us-central1.run.app";

export interface SessionStatistics {
  user_messages: number;
  assistant_messages: number;
  tool_executions: number;
  generated_assets: number;
}

export interface Session {
  session_id: string;
  created_at: string;
  last_updated: string;
  updated_at?: string;
  total_messages: number;
  message_count?: number;
  last_user_message: string;
  statistics: SessionStatistics;
  preview_assets?: string[];
}

export interface GeneratedAsset {
  url: string;
  type: "image" | "model" | "video";
}

export interface Message {
  id: number;
  timestamp: string;
  role: "user" | "assistant" | "tool";
  content: string;
  display_name: string;
  avatar_color: string;
  generated_assets?: GeneratedAsset[];
}

export interface ConversationResponse {
  session_id: string;
  messages: Message[];
  statistics: SessionStatistics;
}

export interface SessionsResponse {
  sessions: Session[];
  total: number;
}

// Helper to get auth token
const getAuthToken = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || (window as any).authToken || localStorage.getItem("auth_token");
};

// Helper to build headers
const buildHeaders = (accessToken?: string): HeadersInit => {
  const token = accessToken || getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Fetch all conversation sessions for a user
 * GET /conversation-sessions/enhanced?email={email}
 */
export async function fetchConversationSessions(
  email: string,
  accessToken?: string
): Promise<SessionsResponse> {
  const url = `${CHAT_API_URL}/conversation-sessions/enhanced?email=${encodeURIComponent(email)}`;
  console.log("[ChatHistoryAPI] Fetching sessions:", url);

  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(accessToken),
  });

  console.log("[ChatHistoryAPI] Sessions response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[ChatHistoryAPI] Sessions error:", errorText);
    throw new Error(`Failed to fetch sessions: ${response.status}`);
  }

  const data = await response.json();
  console.log("[ChatHistoryAPI] Sessions data:", data);
  return data;
}

/**
 * Create a new conversation session
 * POST /conversation-sessions/create
 */
export async function createConversationSession(
  email: string,
  sessionId?: string,
  accessToken?: string
): Promise<{ session_id: string }> {
  const url = `${CHAT_API_URL}/conversation-sessions/create`;
  console.log("[ChatHistoryAPI] Creating session:", url);

  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(accessToken),
    body: JSON.stringify({
      email,
      session_id: sessionId,
    }),
  });

  console.log("[ChatHistoryAPI] Create response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[ChatHistoryAPI] Create error:", errorText);
    throw new Error(`Failed to create session: ${response.status}`);
  }

  const data = await response.json();
  console.log("[ChatHistoryAPI] Create data:", data);
  return data;
}

/**
 * Update a conversation session (e.g., add messages, update title)
 * POST /conversation-sessions/update
 */
export async function updateConversationSession(
  sessionId: string,
  email: string,
  updates: {
    title?: string;
    message?: {
      role: string;
      content: string;
    };
  },
  accessToken?: string
): Promise<{ success: boolean }> {
  const url = `${CHAT_API_URL}/conversation-sessions/update`;
  console.log("[ChatHistoryAPI] Updating session:", url);

  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(accessToken),
    body: JSON.stringify({
      session_id: sessionId,
      email,
      ...updates,
    }),
  });

  console.log("[ChatHistoryAPI] Update response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[ChatHistoryAPI] Update error:", errorText);
    throw new Error(`Failed to update session: ${response.status}`);
  }

  const data = await response.json();
  console.log("[ChatHistoryAPI] Update data:", data);
  return data;
}

/**
 * Delete a conversation session
 * DELETE /conversation-sessions/delete/{sessionId}
 */
export async function deleteConversationSession(
  sessionId: string,
  email: string,
  accessToken?: string
): Promise<{ success: boolean }> {
  const url = `${CHAT_API_URL}/conversation-sessions/delete/${sessionId}?email=${encodeURIComponent(email)}`;
  console.log("[ChatHistoryAPI] Deleting session:", url);

  const response = await fetch(url, {
    method: "DELETE",
    headers: buildHeaders(accessToken),
  });

  console.log("[ChatHistoryAPI] Delete response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[ChatHistoryAPI] Delete error:", errorText);
    throw new Error(`Failed to delete session: ${response.status}`);
  }

  const data = await response.json();
  console.log("[ChatHistoryAPI] Delete data:", data);
  return data;
}

/**
 * Fetch a specific conversation with all messages
 * GET /conversation-history/{sessionId}/formatted?email={email}
 */
export async function fetchConversationMessages(
  sessionId: string,
  email: string,
  accessToken?: string
): Promise<ConversationResponse> {
  const url = `${CHAT_API_URL}/conversation-history/${sessionId}/formatted?email=${encodeURIComponent(email)}`;
  console.log("[ChatHistoryAPI] Fetching conversation:", url);

  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(accessToken),
  });

  console.log("[ChatHistoryAPI] Conversation response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[ChatHistoryAPI] Conversation error:", errorText);
    throw new Error(`Failed to fetch conversation: ${response.status}`);
  }

  const data = await response.json();
  console.log("[ChatHistoryAPI] Conversation data:", data);
  return data;
}

/**
 * Export conversation as markdown
 * GET /conversation-history/{sessionId}/export-markdown?email={email}
 */
export async function exportConversationMarkdown(
  sessionId: string,
  email: string,
  accessToken?: string
): Promise<Blob> {
  const url = `${CHAT_API_URL}/conversation-history/${sessionId}/export-markdown?email=${encodeURIComponent(email)}`;
  console.log("[ChatHistoryAPI] Exporting markdown:", url);

  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(accessToken),
  });

  console.log("[ChatHistoryAPI] Export response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[ChatHistoryAPI] Export error:", errorText);
    throw new Error(`Failed to export conversation: ${response.status}`);
  }

  return response.blob();
}
