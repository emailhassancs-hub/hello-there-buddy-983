// API utility function for model optimization
export async function apiFetch<T>(
  endpoint: string,
  options?: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<T> {
  const baseUrl = "http://localhost:8000";
  const authToken = (window as any).authToken;
  
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

  const response = await fetch(`${baseUrl}${endpoint}`, config);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
