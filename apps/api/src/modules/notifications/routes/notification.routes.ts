import { Router } from 'express'
import { authenticate } from '../../../shared/middleware/auth'
import * as controller from '../controllers/notification.controller'

const router = Router()
router.use(authenticate)

router.post('/', controller.createNotification)
router.get('/', controller.listNotifications)
router.patch('/:id/read', controller.markRead)
router.patch('/read-all', controller.markAllRead)

export default router
