import type {
  BaseUser,
  ApiResponse,
} from '@fixmate/shared-types';

import { ApiClient } from './client';

export function createUsersApi(
  client: ApiClient
) {
  return {
    getMe(): Promise<BaseUser> {
      return client.get<BaseUser>(
        '/users/me'
      );
    },

    getUser(
      userId: string
    ): Promise<BaseUser> {
      return client.get<BaseUser>(
        `/users/${userId}`
      );
    },

    updateUser(
      userId: string,
      data: Partial<BaseUser>
    ): Promise<BaseUser> {
      return client.patch<BaseUser>(
        `/users/${userId}`,
        data
      );
    },

    deleteUser(
      userId: string
    ): Promise<ApiResponse> {
      return client.delete<ApiResponse>(
        `/users/${userId}`
      );
    },
  };
}