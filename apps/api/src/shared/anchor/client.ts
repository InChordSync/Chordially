import { env } from "../config/env.js"
import { HttpAnchorClient, type Sep24AnchorClient } from "./sep24-client.js"

export const anchorClient: Sep24AnchorClient = new HttpAnchorClient({
  baseUrl: env.ANCHOR_BASE_URL,
})
