import { Router, Request, Response } from 'express'

const router = Router()

// Placeholder analytics routes - to be implemented later
router.get('/stats', (req: Request, res: Response) => {
  res.json({ message: 'Analytics stats endpoint - to be implemented' })
})

router.get('/dashboard', (req: Request, res: Response) => {
  res.json({ message: 'Analytics dashboard endpoint - to be implemented' })
})

export { router as analyticsRoutes }
