import type { PaginatedResponse, PaginationMeta } from '@lubdiesel/shared';

export interface PaginationInput {
  page: number;
  pageSize: number;
}

/** Computes Prisma `skip`/`take` from page-based pagination input. */
export function toSkipTake({ page, pageSize }: PaginationInput): { skip: number; take: number } {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function buildPaginationMeta(
  total: number,
  { page, pageSize }: PaginationInput,
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
  };
}

export function paginate<T>(
  data: T[],
  total: number,
  input: PaginationInput,
): PaginatedResponse<T> {
  return { data, meta: buildPaginationMeta(total, input) };
}
