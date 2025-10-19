import { Router, Request, Response } from 'express'

const router = Router()

// Placeholder subscription routes - to be implemented later
router.get('/plans', (req: Request, res: Response) => {
  res.json({ message: 'Subscription plans endpoint - to be implemented' })
})

router.post('/subscribe', (req: Request, res: Response) => {
  res.json({ message: 'Subscribe endpoint - to be implemented' })
})

export { router as subscriptionRoutes }
