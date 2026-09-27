export interface OrderedMediaItem {
  id: string
  position: number
  isCover: boolean
}

/**
 * Reorders media items to match `orderedIds`, re-numbering `position`
 * sequentially. Items not listed in `orderedIds` are appended at the end
 * in their existing relative order.
 */
export function reorderMedia(
  items: OrderedMediaItem[],
  orderedIds: string[]
): OrderedMediaItem[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  const ordered = orderedIds
    .map((id) => byId.get(id))
    .filter((item): item is OrderedMediaItem => Boolean(item))
  const remaining = items.filter((item) => !orderedIds.includes(item.id))

  return [...ordered, ...remaining].map((item, position) => ({
    ...item,
    position,
    isCover: item.isCover,
  }))
}

/** Marks `coverId` as the cover image and unmarks every other item. */
export function selectCover(
  items: OrderedMediaItem[],
  coverId: string
): OrderedMediaItem[] {
  return items.map((item) => ({ ...item, isCover: item.id === coverId }))
}
