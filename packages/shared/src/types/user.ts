import type { CreatorProfileResponse } from "./creator.js"
import type { FanProfileResponse } from "./fan.js"

export interface MeResponse {
  user: {
    id: string
    email: string
    creatorProfile: CreatorProfileResponse | null
    fanProfile: FanProfileResponse | null
  }
}
