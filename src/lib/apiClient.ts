// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request/Response types
export interface ApiRequestConfig extends RequestInit {
  timeout?: number;
  retry?: boolean;
  retryAttempts?: number;
  skipAuth?: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

/**
 * TokenManager — kept as a no-op shim so any remaining call sites compile.
 * The JWT now lives exclusively in an HttpOnly cookie set by the server;
 * JS never reads or writes it.
 */
export class TokenManager {
  /** @deprecated Token is now in an HttpOnly cookie — JS cannot access it. */
  static getToken(): null { return null; }
  /** @deprecated No-op. Token is set by the server via Set-Cookie. */
  static setToken(_token: string): void {}
  /** @deprecated Call POST /auth/logout instead to clear the cookie server-side. */
  static removeToken(): void {}
  /** @deprecated Always returns true if the cookie exists — but JS cannot check. */
  static hasToken(): boolean { return false; }
}

// Request interceptors
type RequestInterceptor = (config: ApiRequestConfig) => ApiRequestConfig | Promise<ApiRequestConfig>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
type ErrorInterceptor = (error: ApiError) => Promise<never>;

class InterceptorManager {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  async runRequestInterceptors(config: ApiRequestConfig): Promise<ApiRequestConfig> {
    let modifiedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      modifiedConfig = await interceptor(modifiedConfig);
    }
    return modifiedConfig;
  }

  async runResponseInterceptors(response: Response): Promise<Response> {
    let modifiedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      modifiedResponse = await interceptor(modifiedResponse);
    }
    return modifiedResponse;
  }

  async runErrorInterceptors(error: ApiError): Promise<never> {
    for (const interceptor of this.errorInterceptors) {
      await interceptor(error);
    }
    throw error;
  }
}

// Main API Client
class ApiClient {
  private baseURL: string;
  private interceptors: InterceptorManager;

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
    this.interceptors = new InterceptorManager();
    this.setupDefaultInterceptors();
  }

  private setupDefaultInterceptors(): void {
    // credentials: 'include' is set on every request (see fetchWithRetry) so
    // the HttpOnly auth_token cookie is sent automatically. No JS token needed.

    // Log requests in development
    if (import.meta.env.DEV) {
      this.interceptors.addRequestInterceptor((config) => {
        console.log(`[API Request] ${config.method || 'GET'}`, config);
        return config;
      });

      this.interceptors.addResponseInterceptor((response) => {
        console.log(`[API Response] ${response.status}`, response);
        return response;
      });
    }

    // Handle 401 — cookie expired or missing; redirect to login
    this.interceptors.addErrorInterceptor(async (error) => {
      if (error.status === 401) {
        const path = window.location.pathname;
        if (path !== '/auth' && !path.startsWith('/dashboard') && !path.startsWith('/admin')) {
          window.location.href = '/auth';
        }
      }
      throw error;
    });
  }

  // Add custom interceptors
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.interceptors.addRequestInterceptor(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.interceptors.addResponseInterceptor(interceptor);
  }

  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.interceptors.addErrorInterceptor(interceptor);
  }

  // Timeout wrapper
  private async fetchWithTimeout(
    url: string,
    config: ApiRequestConfig
  ): Promise<Response> {
    const timeout = config.timeout || API_CONFIG.TIMEOUT;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, 'TIMEOUT');
      }
      throw error;
    }
  }

  // Retry logic
  private async fetchWithRetry(
    url: string,
    config: ApiRequestConfig,
    attempt: number = 1
  ): Promise<Response> {
    try {
      return await this.fetchWithTimeout(url, config);
    } catch (error: any) {
      const maxAttempts = config.retryAttempts || API_CONFIG.RETRY_ATTEMPTS;
      const shouldRetry = config.retry !== false && attempt < maxAttempts;

      if (shouldRetry && this.isRetryableError(error)) {
        const delay = API_CONFIG.RETRY_DELAY * attempt;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, config, attempt + 1);
      }

      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors or 5xx server errors
    return (
      error.name === 'TypeError' || // Network error
      error.name === 'AbortError' || // Timeout
      (error.status >= 500 && error.status < 600) // Server error
    );
  }

  // Main request method
  async request<T = any>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    let requestConfig: ApiRequestConfig = {
      method: 'GET',
      credentials: 'include',   // always send the HttpOnly auth cookie
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    };

    // Run request interceptors
    requestConfig = await this.interceptors.runRequestInterceptors(requestConfig);

    // Build URL
    const url = `${this.baseURL}${endpoint}`;

    try {
      // Make request with retry
      let response = await this.fetchWithRetry(url, requestConfig);

      // Run response interceptors
      response = await this.interceptors.runResponseInterceptors(response);

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: any;

      if (response.status === 204 || response.headers.get('content-length') === '0') {
        // No content — return empty object
        data = {};
      } else if (contentType?.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          // Body was empty or malformed despite JSON content-type
          data = {};
        }
      } else {
        data = await response.text();
      }

      // Handle error responses
      if (!response.ok) {
        const error = new ApiError(
          data.message || data.error || response.statusText,
          response.status,
          data.code,
          data
        );
        return await this.interceptors.runErrorInterceptors(error);
      }

      return data as T;
    } catch (error: any) {
      // Convert to ApiError if not already
      if (!(error instanceof ApiError)) {
        const apiError = new ApiError(
          error.message || 'Network error',
          0,
          'NETWORK_ERROR'
        );
        return await this.interceptors.runErrorInterceptors(apiError);
      }

      throw error;
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, config?: ApiRequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Upload file
  async upload<T = any>(endpoint: string, file: File, fieldName: string = 'file'): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type with boundary
    });
  }

  // Download file
  async download(endpoint: string, filename?: string): Promise<void> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      credentials: 'include',   // send auth cookie
    });

    if (!response.ok) {
      throw new ApiError('Download failed', response.status);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
