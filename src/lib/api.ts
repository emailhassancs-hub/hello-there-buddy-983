// API utility function for model optimization
const BASE_URL = "https://games-ai-studio-be-nest-347148155332.us-central1.run.app";

export async function apiFetch<T>(
  endpoint: string,
  options?: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<T> {
  // Get access token from URL first, then window, then localStorage
  const params = new URLSearchParams(window.location.search);
  const authToken = params.get("token") || (window as any).authToken || localStorage.getItem("auth_token");
  
  const config: RequestInit = {
    method: options?.method || "GET",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  };

  if (authToken) {
    (config.headers as Record<string, string>)["Authorization"] = `Bearer ${authToken}`;
  }

  if (options?.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
