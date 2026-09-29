import type { ApiErrorResponse, ApiResponse, PaginatedResponse } from '@lubdiesel/shared';
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

type QueryValue = string | number | boolean | undefined | null;

/** Builds a query string from a params object, skipping empty values. */
export function buildQuery(params: Record<string, QueryValue> = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function request(path: string, options: RequestOptions = {}): Promise<unknown> {
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
    return undefined;
  }

  const payload = await response.json();

  if (!response.ok) {
    const error = payload as ApiErrorResponse;
    throw new ApiError(error.statusCode, error.code, error.message);
  }

  return payload;
}

/** Unwraps the `{ data }` envelope for single-resource responses. */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const payload = await request(path, options);
  return (payload as ApiResponse<T> | undefined)?.data as T;
}

/** Returns the full `{ data, meta }` envelope for paginated list responses. */
export async function apiList<T>(
  path: string,
  options: RequestOptions = {},
): Promise<PaginatedResponse<T>> {
  const payload = await request(path, options);
  return payload as PaginatedResponse<T>;
}

/** Returns the raw response body (for endpoints that opt out of the envelope, e.g. the pipeline board). */
export async function apiFetchRaw<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const payload = await request(path, options);
  return payload as T;
}
