import express, { type Express } from "express"
import { authRouter } from "./modules/auth/routes/auth.routes.js"
import { creatorsRouter } from "./modules/creators/routes/creator.routes.js"
import { mediaRouter } from "./modules/media/routes/media.routes.js"
import { usersRouter } from "./modules/users/routes/user.routes.js"
import { discoveryRouter } from "./modules/discovery/routes/discovery.routes.js"
import { searchRouter } from "./modules/search/routes/search.routes.js"
import { followRouter } from "./modules/follow/routes/follow.routes.js"
import { bookmarkRouter } from "./modules/bookmarks/routes/bookmark.routes.js"
import { errorHandler } from "./shared/middleware/error-handler.js"

export function createApp(): Express {
  const app = express()

  app.use(express.json())

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" })
  })

  app.use("/api/auth", authRouter)
  app.use("/api/creators", creatorsRouter)
  app.use("/api/creators", mediaRouter)
  app.use("/api/users", usersRouter)
  app.use("/api/discover", discoveryRouter)
  app.use("/api/search", searchRouter)
  app.use("/api/follow", followRouter)
  app.use("/api/bookmarks", bookmarkRouter)

  app.use(errorHandler)

  return app
}
