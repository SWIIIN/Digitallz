import winston from 'winston'
import { config } from '../config'

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
)

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`
    }
    
    return log
  })
)

export const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { 
    service: 'digitallz-backend',
    version: '1.0.0',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),
    
    // File transports
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
})

// Ajouter des transports spécifiques en production
if (config.nodeEnv === 'production') {
  // Transport pour les logs d'audit
  logger.add(new winston.transports.File({
    filename: 'logs/audit.log',
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }))
}

// Gestion des exceptions non capturées
logger.exceptions.handle(
  new winston.transports.File({ filename: 'logs/exceptions.log' })
)

// Gestion des rejets de promesses non gérés
logger.rejections.handle(
  new winston.transports.File({ filename: 'logs/rejections.log' })
)

// Méthodes utilitaires
export const logRequest = (req: any, res: any, next: any) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const { method, url, ip } = req
    const { statusCode } = res
    
    logger.info('HTTP Request', {
      method,
      url,
      ip,
      statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
    })
  })
  
  next()
}

export const logError = (error: Error, context?: any) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    context,
  })
}

export const logSecurity = (event: string, details: any) => {
  logger.warn('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString(),
  })
}

export const logPerformance = (operation: string, duration: number, metadata?: any) => {
  logger.info('Performance Metric', {
    operation,
    duration: `${duration}ms`,
    metadata,
  })
}

export const logBusiness = (event: string, data: any) => {
  logger.info('Business Event', {
    event,
    data,
    timestamp: new Date().toISOString(),
  })
}

export default logger
