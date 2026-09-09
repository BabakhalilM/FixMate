import {
  ApiClient,
  createAuthApi,
} from '@fixmate/api-client';

const apiClient = new ApiClient({
  baseUrl:
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000/api',
});


export const authApi =
  createAuthApi(apiClient);