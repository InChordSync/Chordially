import { Router, type Request, type Response } from 'express'
import { authenticate } from '../../../shared/middleware/auth'
import { walletController } from '../controllers/wallet.controller'

const router = Router()
router.use(authenticate)

router.get('/identity', (req: Request, res: Response) => walletController.getWalletIdentity(req, res))
router.post('/link/init', (req: Request, res: Response) => walletController.initiateLink(req, res))
router.post('/link/verify', (req: Request, res: Response) => walletController.verifyLink(req, res))
router.get('/link/session', (req: Request, res: Response) => walletController.getSession(req, res))
router.post('/link/unlink', (req: Request, res: Response) => walletController.unlink(req, res))
router.get('/status', (req: Request, res: Response) => walletController.getStatus(req, res))
router.post('/sep10/challenge', (req: Request, res: Response) => walletController.getSep10Challenge(req, res))
router.post('/sep10/verify', (req: Request, res: Response) => walletController.verifySep10(req, res))

export default router
