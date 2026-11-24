import { AppError } from "../../../shared/errors/app-error.js"
import { creatorService } from "../../creators/services/creator.service.js"
import { streamRepository } from "../repositories/stream.repository.js"
import type { Stream } from "../types/stream.types.js"

export const streamService = {
  findById(id: string): Promise<Stream | null> {
    return streamRepository.findById(id)
  },

  async startStream(hostUserId: string, title?: string): Promise<Stream> {
    const creator = await creatorService.findByUserId(hostUserId)

    if (!creator) {
      throw new AppError(
        403,
        "CREATOR_PROFILE_REQUIRED",
        "Only creators can start a stream"
      )
    }

    const openStream = await streamRepository.findOpenByCreator(creator.id)
    if (openStream) {
      throw new AppError(
        409,
        "STREAM_ALREADY_LIVE",
        "This creator already has a live stream"
      )
    }

    return streamRepository.create({ creatorId: creator.id, title })
  },

  async endStream(id: string, hostUserId: string): Promise<Stream> {
    const stream = await streamRepository.findById(id)

    if (!stream) {
      throw new AppError(404, "STREAM_NOT_FOUND", "Stream not found")
    }

    const creator = await creatorService.findByUserId(hostUserId)

    if (!creator || creator.id !== stream.creatorId) {
      throw new AppError(403, "FORBIDDEN", "You do not have permission to end this stream")
    }

    if (stream.endedAt) {
      return stream
    }

    return streamRepository.end(id)
  },
}
