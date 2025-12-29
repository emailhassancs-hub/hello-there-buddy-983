export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

import { LocalStorageKeys } from '@/enums/localstorage'
import axios, { AxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:5000'

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
})

axiosInstance.interceptors.request.use((config) => {
  const skipAuthHeader = config.headers?.['X-Skip-Auth'] as string | undefined
  const shouldSkipAuth = skipAuthHeader === 'true'
  if (shouldSkipAuth) {
    if (config.headers) delete (config.headers as any)['X-Skip-Auth']
    return config
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(LocalStorageKeys.AccessToken)
    if (token) {
      if (!config.headers) {
        config.headers = {} as any
      }
      ;(config.headers as any).Authorization = `Bearer ${token}`
    }
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(LocalStorageKeys.AccessToken)
      localStorage.removeItem(LocalStorageKeys.User)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export async function apiFetch<T>(
  path: string,
  options?: {
    method?: HttpMethod
    body?: unknown
    headers?: Record<string, string>
    skipAuth?: boolean
    timeout?: number // Timeout in milliseconds
    signal?: AbortSignal // Add support for AbortController
  }
): Promise<T> {
  const { method = 'GET', body, skipAuth = false, timeout, signal, headers } = options || {}
    console.log(API_BASE_URL,'in api.ts=========>>>')
  // Build request config
  const config: AxiosRequestConfig = {
    url: path,
    method,
    data: body,
    headers: headers || {},
    timeout, // Add timeout to config
    signal, // Add abort signal to config
  }

  // Handle FormData - don't set Content-Type header, let browser set it automatically
  if (body instanceof FormData) {
    // Don't set Content-Type header for FormData - browser will set multipart/form-data automatically
    config.headers = { ...config.headers }
    delete (config.headers as any)['Content-Type']
  } else {
    // For non-FormData, set JSON content type
    config.headers = { ...config.headers, 'Content-Type': 'application/json' }
  }

  // Set X-Skip-Auth header if skipAuth is true (interceptor will remove it before sending)
  if (skipAuth) {
    config.headers = { ...(config.headers || {}), 'X-Skip-Auth': 'true' }
  }

  try {
    const res = await axiosInstance.request<T>(config)
    return res.data as T
  } catch (err: any) {
    const status: number | undefined = err?.response?.status
    const message: string =
      err?.response?.data?.message ||
      err?.message ||
      (status ? `Request failed with status ${status}` : 'Request failed')

    throw new Error(message)
  }
}
