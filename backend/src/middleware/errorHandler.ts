import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = error.statusCode || 500
  const message = error.message || 'Internal Server Error'

  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // Don't leak error details in production
  const errorResponse = {
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Something went wrong' 
        : message,
      status: statusCode,
      timestamp: new Date().toISOString()
    }
  }

  res.status(statusCode).json(errorResponse)
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message)
  error.statusCode = statusCode
  error.isOperational = true
  return error
}
