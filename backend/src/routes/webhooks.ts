import { Router, Request, Response } from 'express'

const router = Router()

// Placeholder webhook routes - to be implemented later
router.post('/stripe', (req: Request, res: Response) => {
  res.json({ message: 'Stripe webhook endpoint - to be implemented' })
})

export { router as webhookRoutes }
