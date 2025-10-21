import express from 'express'
import { authController } from '../controllers/authController'
import { validateUserRegistration, validateUserLogin } from '../middleware/validation'

const router = express.Router()

// Routes publiques
router.post('/register', validateUserRegistration, authController.register)
router.post('/login', validateUserLogin, authController.login)
router.post('/refresh', authController.refreshToken)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)

// Routes protégées
router.post('/logout', authController.logout)
router.get('/profile', authController.getProfile)
router.put('/profile', authController.updateProfile)
router.post('/change-password', authController.changePassword)

export { router as authRoutes }