import { Router } from 'express'
import { paymentController } from '../controllers/payment.controller.js'
import { requireAuth } from '../../../shared/middleware/auth.middleware.js'

export const paymentRouter: Router = Router()

paymentRouter.use(requireAuth)
paymentRouter.post('/tip', paymentController.tip)
paymentRouter.get('/receipts', paymentController.receipts)
paymentRouter.get('/receipts/:id', paymentController.getReceipt)
paymentRouter.patch('/receipts/:id/confirm', paymentController.confirm)
paymentRouter.get('/earnings', paymentController.earnings)
