import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

export const subscriptionController = {
  async getPlans(req: Request, res: Response) {
    try {
      const plans = [
        {
          id: 'free',
          name: 'Gratuit',
          price: 0,
          features: [
            '5 recherches par jour',
            'Données de base',
            'Support email'
          ],
          limits: {
            dailySearches: 5,
            keywordHistory: 100,
            exportFormats: ['csv']
          }
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 29,
          features: [
            '100 recherches par jour',
            'Données avancées',
            'Analytics détaillées',
            'Support prioritaire',
            'Export multiple formats'
          ],
          limits: {
            dailySearches: 100,
            keywordHistory: 1000,
            exportFormats: ['csv', 'xlsx', 'json']
          }
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 99,
          features: [
            'Recherches illimitées',
            'Toutes les données',
            'Analytics avancées',
            'Support dédié',
            'API access',
            'Intégrations personnalisées'
          ],
          limits: {
            dailySearches: -1,
            keywordHistory: -1,
            exportFormats: ['csv', 'xlsx', 'json', 'pdf']
          }
        }
      ]

      res.json({
        success: true,
        data: plans
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération des plans:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des plans'
      })
    }
  },

  async getCurrentSubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id

      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        },
        orderBy: { createdAt: 'desc' }
      })

      if (!subscription) {
        return res.json({
          success: true,
          data: {
            plan: 'free',
            status: 'active',
            features: ['5 recherches par jour', 'Données de base']
          }
        })
      }

      res.json({
        success: true,
        data: subscription
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'abonnement:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'abonnement'
      })
    }
  },

  async createSubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { planId, paymentMethodId } = req.body

      // Vérifier si l'utilisateur a déjà un abonnement actif
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        }
      })

      if (existingSubscription) {
        return res.status(400).json({
          success: false,
          error: 'Vous avez déjà un abonnement actif'
        })
      }

      // Créer l'abonnement
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          planName: planId,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
        }
      })

      res.status(201).json({
        success: true,
        message: 'Abonnement créé avec succès',
        data: subscription
      })
    } catch (error) {
      logger.error('Erreur lors de la création de l\'abonnement:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de l\'abonnement'
      })
    }
  },

  async upgradeSubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { newPlanId } = req.body

      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        }
      })

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Aucun abonnement actif trouvé'
        })
      }

      // Mettre à jour l'abonnement
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planName: newPlanId,
          updatedAt: new Date()
        }
      })

      res.json({
        success: true,
        message: 'Abonnement mis à niveau avec succès',
        data: updatedSubscription
      })
    } catch (error) {
      logger.error('Erreur lors de la mise à niveau de l\'abonnement:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à niveau de l\'abonnement'
      })
    }
  },

  async downgradeSubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { newPlanId } = req.body

      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        }
      })

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Aucun abonnement actif trouvé'
        })
      }

      // Mettre à jour l'abonnement
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planName: newPlanId,
          updatedAt: new Date()
        }
      })

      res.json({
        success: true,
        message: 'Abonnement rétrogradé avec succès',
        data: updatedSubscription
      })
    } catch (error) {
      logger.error('Erreur lors de la rétrogradation de l\'abonnement:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la rétrogradation de l\'abonnement'
      })
    }
  },

  async cancelSubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id

      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE'
        }
      })

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Aucun abonnement actif trouvé'
        })
      }

      // Annuler l'abonnement
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELED',
          updatedAt: new Date()
        }
      })

      res.json({
        success: true,
        message: 'Abonnement annulé avec succès',
        data: updatedSubscription
      })
    } catch (error) {
      logger.error('Erreur lors de l\'annulation de l\'abonnement:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'annulation de l\'abonnement'
      })
    }
  },

  async reactivateSubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id

      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'CANCELED'
        },
        orderBy: { createdAt: 'desc' }
      })

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Aucun abonnement annulé trouvé'
        })
      }

      // Réactiver l'abonnement
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        }
      })

      res.json({
        success: true,
        message: 'Abonnement réactivé avec succès',
        data: updatedSubscription
      })
    } catch (error) {
      logger.error('Erreur lors de la réactivation de l\'abonnement:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la réactivation de l\'abonnement'
      })
    }
  },

  async getBillingHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id

      const subscriptions = await prisma.subscription.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      res.json({
        success: true,
        data: subscriptions
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'historique de facturation:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'historique de facturation'
      })
    }
  },

  async handleWebhook(req: Request, res: Response) {
    try {
      const { type, data } = req.body

      logger.info(`Webhook reçu: ${type}`, data)

      // Traiter les différents types de webhooks Stripe
      switch (type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          // Mettre à jour l'abonnement
          break
        case 'customer.subscription.deleted':
          // Annuler l'abonnement
          break
        case 'invoice.payment_succeeded':
          // Paiement réussi
          break
        case 'invoice.payment_failed':
          // Paiement échoué
          break
        default:
          logger.warn(`Type de webhook non géré: ${type}`)
      }

      res.json({ received: true })
    } catch (error) {
      logger.error('Erreur lors du traitement du webhook:', error)
      res.status(500).json({
        success: false,
        error: 'Erreur lors du traitement du webhook'
      })
    }
  }
}
