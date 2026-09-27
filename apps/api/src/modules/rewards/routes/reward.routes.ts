import { Router } from "express"

export const rewardsRouter = Router()

rewardsRouter.get("/my-rewards", (req, res) => {
  res.status(200).json({ rewards: [] })
})
