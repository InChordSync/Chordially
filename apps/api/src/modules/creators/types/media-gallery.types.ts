/** A single media asset in a creator's profile gallery. */
export interface CreatorMediaItem {
  id: string
  url: string
  position: number
  isCover: boolean
}

export interface CreatorMediaGallery {
  creatorId: string
  items: CreatorMediaItem[]
}

export function addMediaItem(
  gallery: CreatorMediaGallery,
  item: Omit<CreatorMediaItem, "position" | "isCover">
): CreatorMediaGallery {
  const position = gallery.items.length
  return {
    ...gallery,
    items: [
      ...gallery.items,
      { ...item, position, isCover: gallery.items.length === 0 },
    ],
  }
}

export function removeMediaItem(
  gallery: CreatorMediaGallery,
  itemId: string
): CreatorMediaGallery {
  const items = gallery.items
    .filter((item) => item.id !== itemId)
    .map((item, position) => ({ ...item, position }))

  return { ...gallery, items }
}
