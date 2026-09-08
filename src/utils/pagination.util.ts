import { ApiError } from "./api-response.util";

export interface PaginationQuery {
  page?: unknown;
  limit?: unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export function parsePositiveInteger(value: unknown, fallback: number, field: string): number {
  if (value === undefined) return fallback;
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    !/^\d+$/.test(String(value)) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) <= 0
  ) {
    throw new ApiError(`${field} must be a positive integer`);
  }
  return Number(value);
}

export function parsePagination(query: PaginationQuery = {}, defaultLimit = 10, maxLimit = 50) {
  const page = parsePositiveInteger(query.page, 1, "page");
  const limit = parsePositiveInteger(query.limit, defaultLimit, "limit");
  if (limit > maxLimit) throw new ApiError(`limit must be less than or equal to ${maxLimit}`);
  const offset = (page - 1) * limit;
  if (!Number.isSafeInteger(offset)) throw new ApiError("page is too large");

  return { page, limit, offset };
}
