import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  TechnicianUser,
} from "@fixmate/shared-types";

import { ApiClient } from "./client";

export function createAuthApi(client: ApiClient) {
  return {
    login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
      return client.post<ApiResponse<AuthResponse>>("/auth/login", credentials);
    },

    register(credentials: RegisterData): Promise<ApiResponse<AuthResponse>> {
      console.log("Registering user with credentials:", credentials);

      return client.post<ApiResponse<AuthResponse>>(
        "/auth/register",
        credentials,
      );
    },

    logout(): Promise<ApiResponse> {
      return client.post<ApiResponse>("/auth/logout");
    },

    getMe(): Promise<ApiResponse<TechnicianUser>> {
      return client.get<ApiResponse<TechnicianUser>>("/auth/me");
    },
    
  };
}
