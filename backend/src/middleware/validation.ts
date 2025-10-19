import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

// Validation schemas
const keywordSearchSchema = Joi.object({
  keyword: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .required()
    .messages({
      'string.min': 'Le mot-clé doit contenir au moins 2 caractères',
      'string.max': 'Le mot-clé ne peut pas dépasser 100 caractères',
      'string.pattern.base': 'Le mot-clé ne peut contenir que des lettres, chiffres, espaces, tirets et underscores',
      'any.required': 'Le mot-clé est requis',
    }),
  platform: Joi.string()
    .valid('amazon', 'etsy', 'ebay', 'shopify', 'gumroad')
    .required()
    .messages({
      'any.only': 'La plateforme doit être l\'une des suivantes: amazon, etsy, ebay, shopify, gumroad',
      'any.required': 'La plateforme est requise',
    }),
  includeRelated: Joi.boolean().default(false),
  includeTrends: Joi.boolean().default(false),
  includeCompetitors: Joi.boolean().default(false),
  includeDifficulty: Joi.boolean().default(false),
})

const keywordTrendsSchema = Joi.object({
  platform: Joi.string()
    .valid('amazon', 'etsy', 'ebay', 'shopify', 'gumroad')
    .required()
    .messages({
      'any.only': 'La plateforme doit être l\'une des suivantes: amazon, etsy, ebay, shopify, gumroad',
      'any.required': 'La plateforme est requise',
    }),
  dateRange: Joi.string()
    .valid('7d', '30d', '90d', '1y')
    .default('30d')
    .messages({
      'any.only': 'La période doit être l\'une des suivantes: 7d, 30d, 90d, 1y',
    }),
})

const popularKeywordsSchema = Joi.object({
  platform: Joi.string()
    .valid('amazon', 'etsy', 'ebay', 'shopify', 'gumroad')
    .optional()
    .messages({
      'any.only': 'La plateforme doit être l\'une des suivantes: amazon, etsy, ebay, shopify, gumroad',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'La limite doit être d\'au moins 1',
      'number.max': 'La limite ne peut pas dépasser 100',
    }),
  sortBy: Joi.string()
    .valid('volume', 'trend', 'opportunity', 'competition')
    .default('volume')
    .messages({
      'any.only': 'Le tri doit être l\'un des suivants: volume, trend, opportunity, competition',
    }),
})

const keywordSuggestionsSchema = Joi.object({
  keyword: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .required()
    .messages({
      'string.min': 'Le mot-clé doit contenir au moins 2 caractères',
      'string.max': 'Le mot-clé ne peut pas dépasser 50 caractères',
      'string.pattern.base': 'Le mot-clé ne peut contenir que des lettres, chiffres, espaces, tirets et underscores',
      'any.required': 'Le mot-clé est requis',
    }),
  platform: Joi.string()
    .valid('amazon', 'etsy', 'ebay', 'shopify', 'gumroad')
    .required()
    .messages({
      'any.only': 'La plateforme doit être l\'une des suivantes: amazon, etsy, ebay, shopify, gumroad',
      'any.required': 'La plateforme est requise',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .messages({
      'number.min': 'La limite doit être d\'au moins 1',
      'number.max': 'La limite ne peut pas dépasser 50',
    }),
})

const bulkAnalyzeSchema = Joi.object({
  keywords: Joi.array()
    .items(
      Joi.string()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-Z0-9\s\-_]+$/)
        .messages({
          'string.min': 'Chaque mot-clé doit contenir au moins 2 caractères',
          'string.max': 'Chaque mot-clé ne peut pas dépasser 100 caractères',
          'string.pattern.base': 'Chaque mot-clé ne peut contenir que des lettres, chiffres, espaces, tirets et underscores',
        })
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'Au moins un mot-clé est requis',
      'array.max': 'Maximum 50 mots-clés autorisés',
      'any.required': 'Les mots-clés sont requis',
    }),
  platform: Joi.string()
    .valid('amazon', 'etsy', 'ebay', 'shopify', 'gumroad')
    .required()
    .messages({
      'any.only': 'La plateforme doit être l\'une des suivantes: amazon, etsy, ebay, shopify, gumroad',
      'any.required': 'La plateforme est requise',
    }),
  includeRelated: Joi.boolean().default(false),
  includeTrends: Joi.boolean().default(false),
})

const competitorAnalysisSchema = Joi.object({
  platform: Joi.string()
    .valid('amazon', 'etsy', 'ebay', 'shopify', 'gumroad')
    .required()
    .messages({
      'any.only': 'La plateforme doit être l\'une des suivantes: amazon, etsy, ebay, shopify, gumroad',
      'any.required': 'La plateforme est requise',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'La limite doit être d\'au moins 1',
      'number.max': 'La limite ne peut pas dépasser 100',
    }),
})

const keywordDifficultySchema = Joi.object({
  platform: Joi.string()
    .valid('amazon', 'etsy', 'ebay', 'shopify', 'gumroad')
    .required()
    .messages({
      'any.only': 'La plateforme doit être l\'une des suivantes: amazon, etsy, ebay, shopify, gumroad',
      'any.required': 'La plateforme est requise',
    }),
})

// Validation middleware factory
const validate = (schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }))

      return res.status(400).json({
        success: false,
        error: 'Données de validation invalides',
        details: errors,
      })
    }

    // Replace the original data with validated and sanitized data
    if (source === 'body') {
      req.body = value
    } else if (source === 'query') {
      req.query = value
    } else {
      req.params = value
    }

    next()
  }
}

// Export validation middleware
export const validateKeywordSearch = validate(keywordSearchSchema, 'body')
export const validateKeywordTrends = validate(keywordTrendsSchema, 'query')
export const validatePopularKeywords = validate(popularKeywordsSchema, 'query')
export const validateKeywordSuggestions = validate(keywordSuggestionsSchema, 'query')
export const validateBulkAnalyze = validate(bulkAnalyzeSchema, 'body')
export const validateCompetitorAnalysis = validate(competitorAnalysisSchema, 'query')
export const validateKeywordDifficulty = validate(keywordDifficultySchema, 'query')

// Custom validation functions
export const validateKeyword = (keyword: string): boolean => {
  const keywordRegex = /^[a-zA-Z0-9\s\-_]{2,100}$/
  return keywordRegex.test(keyword)
}

export const validatePlatform = (platform: string): boolean => {
  const validPlatforms = ['amazon', 'etsy', 'ebay', 'shopify', 'gumroad']
  return validPlatforms.includes(platform)
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[;()]/g, '') // Remove potential SQL injection characters
}

export const validatePagination = (page: number, limit: number): boolean => {
  return page >= 1 && limit >= 1 && limit <= 100
}

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const now = new Date()
  
  return start < end && end <= now && (end.getTime() - start.getTime()) <= (365 * 24 * 60 * 60 * 1000) // Max 1 year
}

// Rate limiting validation
export const validateRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any
  const userId = user?.id || req.ip
  
  // This would integrate with your rate limiting service
  // For now, we'll just pass through
  next()
}

// Input sanitization middleware
export const sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key])
      }
    }
  }
  
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeInput(req.query[key] as string)
      }
    }
  }
  
  next()
}

export default {
  validateKeywordSearch,
  validateKeywordTrends,
  validatePopularKeywords,
  validateKeywordSuggestions,
  validateBulkAnalyze,
  validateCompetitorAnalysis,
  validateKeywordDifficulty,
  validateKeyword,
  validatePlatform,
  validateEmail,
  validatePassword,
  sanitizeInput,
  validatePagination,
  validateDateRange,
  validateRateLimit,
  sanitizeInputs,
}
