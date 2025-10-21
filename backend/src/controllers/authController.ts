import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { config } from '../config'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Un utilisateur avec cet email existe déjà'
        })
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 12)

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName
        }
      })

      // Générer les tokens
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )

      const refreshToken = jwt.sign(
        { id: user.id },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
      )

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          },
          accessToken,
          refreshToken
        }
      })
    } catch (error) {
      logger.error('Erreur lors de l\'inscription:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'inscription'
      })
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body

      // Trouver l'utilisateur
      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Email ou mot de passe incorrect'
        })
      }

      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(password, user.password)

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Email ou mot de passe incorrect'
        })
      }

      // Vérifier si le compte est actif
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Compte désactivé'
        })
      }

      // Générer les tokens
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )

      const refreshToken = jwt.sign(
        { id: user.id },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
      )

      res.json({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          },
          accessToken,
          refreshToken
        }
      })
    } catch (error) {
      logger.error('Erreur lors de la connexion:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la connexion'
      })
    }
  },

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: 'Token de rafraîchissement requis'
        })
      }

      // Vérifier le token de rafraîchissement
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any

      // Trouver l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      })

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Token invalide'
        })
      }

      // Générer un nouveau token d'accès
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )

      res.json({
        success: true,
        data: { accessToken }
      })
    } catch (error) {
      logger.error('Erreur lors du rafraîchissement du token:', error)
      res.status(401).json({
        success: false,
        error: 'Token invalide'
      })
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body

      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        })
      }

      // Générer un token de réinitialisation
      const resetToken = jwt.sign(
        { id: user.id, type: 'password_reset' },
        config.jwt.secret,
        { expiresIn: '1h' }
      )

      // TODO: Envoyer l'email de réinitialisation
      logger.info(`Token de réinitialisation généré pour ${email}: ${resetToken}`)

      res.json({
        success: true,
        message: 'Email de réinitialisation envoyé'
      })
    } catch (error) {
      logger.error('Erreur lors de la demande de réinitialisation:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la demande de réinitialisation'
      })
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body

      // Vérifier le token
      const decoded = jwt.verify(token, config.jwt.secret) as any

      if (decoded.type !== 'password_reset') {
        return res.status(400).json({
          success: false,
          error: 'Token invalide'
        })
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(password, 12)

      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: decoded.id },
        data: { password: hashedPassword }
      })

      res.json({
        success: true,
        message: 'Mot de passe réinitialisé avec succès'
      })
    } catch (error) {
      logger.error('Erreur lors de la réinitialisation du mot de passe:', error)
      res.status(400).json({
        success: false,
        error: 'Token invalide ou expiré'
      })
    }
  },

  async logout(req: Request, res: Response) {
    try {
      // Dans une implémentation complète, on ajouterait le token à une liste noire
      res.json({
        success: true,
        message: 'Déconnexion réussie'
      })
    } catch (error) {
      logger.error('Erreur lors de la déconnexion:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la déconnexion'
      })
    }
  },

  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        })
      }

      res.json({
        success: true,
        data: user
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération du profil:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du profil'
      })
    }
  },

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { firstName, lastName, avatar } = req.body

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          avatar
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isActive: true,
          updatedAt: true
        }
      })

      res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: user
      })
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du profil:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour du profil'
      })
    }
  },

  async changePassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { currentPassword, newPassword } = req.body

      // Récupérer l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        })
      }

      // Vérifier le mot de passe actuel
      const isValidPassword = await bcrypt.compare(currentPassword, user.password)

      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          error: 'Mot de passe actuel incorrect'
        })
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 12)

      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      })

      res.json({
        success: true,
        message: 'Mot de passe modifié avec succès'
      })
    } catch (error) {
      logger.error('Erreur lors du changement de mot de passe:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors du changement de mot de passe'
      })
    }
  }
}
