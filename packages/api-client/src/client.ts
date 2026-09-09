export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
}
export class ApiError extends Error {
  status: number;
  success?: boolean;

  constructor(message: string, status: number, success?: boolean) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.success = success;
  }
}

export class ApiClient {

  
  private baseUrl: string;
  private getToken?: ApiClientConfig["getToken"];

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.getToken = config.getToken;
  }
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getToken ? await this.getToken() : null;

    const headers = new Headers(options.headers);

    headers.set("Content-Type", "application/json");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let response: Response;
    let data: unknown;

    try {
      console.log("Calling:", `${this.baseUrl}${endpoint}`);
      console.log("Base URL:", this.baseUrl);
      console.log("Endpoint:", endpoint);
      console.log("Full URL:", `${this.baseUrl}${endpoint}`);

      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      data = await response.json();
      console.log("Response data:", data);
    } catch (err) {
      console.error("Fetch Error:", err);
      throw err;
    }
    
    console.log("Status:", response.status);
    console.log("Response:", data);
    if (!response.ok) {
      let message = "Something went wrong";

      if (typeof data === "object" && data !== null) {
        message = (data as any).message || (data as any).error || message;
      }

      throw new ApiError(message, response.status, (data as any)?.success);
    }

    return data as T;
  }
  get<T>(endpoint: string): Promise<T> {
    console.log("GET request to:", `${this.baseUrl}${endpoint}`);
    return this.request<T>(endpoint, {
      method: "GET",
    });
  }

  post<T>(endpoint: string, body?: unknown): Promise<T> {
    console.log("POST request to:", `${this.baseUrl}${endpoint}`);
    console.log("POST body:", body);
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown): Promise<T> {
    console.log("PUT request to:", `${this.baseUrl}${endpoint}`);
    console.log("PUT body:", body);
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown): Promise<T> {
    console.log("PATCH request to:", `${this.baseUrl}${endpoint}`);
    console.log("PATCH body:", body);
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }
}
