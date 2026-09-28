import type { ApiErrorResponse, ApiResponse } from '@lubdiesel/shared';
import { authStorage } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
}

/** Thin fetch wrapper that unwraps the `{ data }` envelope and normalizes errors. */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  if (auth && authStorage.accessToken) {
    finalHeaders.Authorization = `Bearer ${authStorage.accessToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as ApiResponse<T> | ApiErrorResponse;

  if (!response.ok) {
    const error = payload as ApiErrorResponse;
    throw new ApiError(error.statusCode, error.code, error.message);
  }

  return (payload as ApiResponse<T>).data;
}
