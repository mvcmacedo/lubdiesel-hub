/** Standard API response contracts shared by the API and the web client. */

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Envelope for single-resource successful responses. */
export interface ApiResponse<T> {
  data: T;
}

/** Envelope for paginated list responses. */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

/** Standard error body returned by the global exception filter. */
export interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  errors?: ApiFieldError[];
}

/** Common query parameters accepted by paginated list endpoints. */
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
