import { Router } from 'express'
import { authenticate } from '../../../shared/middleware/auth'
import { tipController } from '../controllers/tip.controller'

const router = Router()
router.use(authenticate)
router.post('/build', (req, res) => tipController.build(req, res))
router.post('/submit', (req, res) => tipController.submit(req, res))
export default router
