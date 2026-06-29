import { Router } from 'express'
import { authenticate } from '../../../shared/middleware/auth'
import { paymentIntentController } from '../controllers/payment-intent.controller'

const router = Router()
router.use(authenticate)
router.post('/', (req, res) => paymentIntentController.create(req, res))
router.get('/:id', (req, res) => paymentIntentController.get(req, res))
export default router
