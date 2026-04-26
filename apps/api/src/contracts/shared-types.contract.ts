/**
 * Shared contract types between the API and web/mobile clients.
 * These types must remain in sync across all consumers.
 */

export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: number;
    version: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  meta: {
    timestamp: number;
    version: string;
    total: number;
    page: number;
    limit: number;
  };
}

export interface ErrorResponse {
  error: string;
  code: string;
  statusCode: number;
}
