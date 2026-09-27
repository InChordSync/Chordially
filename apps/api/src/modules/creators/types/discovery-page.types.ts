/** Query params accepted by the paginated discovery endpoint. */
export interface DiscoveryPageParams {
  page: number
  pageSize: number
}

/** A single page of combined creator/fan discovery results. */
export interface DiscoveryPageResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export function paginate<T>(
  items: T[],
  params: DiscoveryPageParams
): DiscoveryPageResult<T> {
  const page = Math.max(1, params.page)
  const pageSize = Math.max(1, params.pageSize)
  const start = (page - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  }
}
