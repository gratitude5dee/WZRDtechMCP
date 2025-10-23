/**
 * Logging Utility
 * Winston-based structured logging with configurable levels and output
 */

import winston from 'winston';

// Get log configuration from environment
const LOG_LEVEL = process.env['LOG_LEVEL'] || 'info';
const LOG_FILE = process.env['LOG_FILE'] || 'fal-mcp.log';
const LOG_MAX_SIZE = parseInt(process.env['LOG_MAX_SIZE'] || '10485760', 10); // 10MB default
const LOG_MAX_FILES = parseInt(process.env['LOG_MAX_FILES'] || '5', 10);
const NODE_ENV = process.env['NODE_ENV'] || 'development';

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
    const serviceTag = service ? `[${service}]` : '';
    return `${timestamp} ${level} ${serviceTag}: ${message}${metaStr}`;
  })
);

/**
 * Create transports based on environment
 */
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: NODE_ENV === 'development' ? consoleFormat : logFormat,
    level: LOG_LEVEL,
  }),
];

// Add file transports in production or if explicitly enabled
if (NODE_ENV === 'production' || process.env['ENABLE_FILE_LOGGING'] === 'true') {
  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: LOG_FILE,
      format: logFormat,
      maxsize: LOG_MAX_SIZE,
      maxFiles: LOG_MAX_FILES,
      level: LOG_LEVEL,
    })
  );

  // Separate error log file
  transports.push(
    new winston.transports.File({
      filename: LOG_FILE.replace('.log', '-error.log'),
      format: logFormat,
      maxsize: LOG_MAX_SIZE,
      maxFiles: LOG_MAX_FILES,
      level: 'error',
    })
  );
}

/**
 * Main logger instance
 */
const mainLogger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'fal-mcp' },
  transports,
  exitOnError: false,
});

/**
 * Logger interface with typed methods
 */
export interface Logger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any> | Error): void;
}

/**
 * Create a child logger with a specific service name
 */
export function createLogger(serviceName: string): Logger {
  const child = mainLogger.child({ service: serviceName });

  return {
    debug: (message: string, meta?: Record<string, any>) => {
      child.debug(message, sanitizeMeta(meta));
    },
    info: (message: string, meta?: Record<string, any>) => {
      child.info(message, sanitizeMeta(meta));
    },
    warn: (message: string, meta?: Record<string, any>) => {
      child.warn(message, sanitizeMeta(meta));
    },
    error: (message: string, meta?: Record<string, any> | Error) => {
      if (meta instanceof Error) {
        child.error(message, {
          error: meta.message,
          stack: meta.stack,
        });
      } else {
        child.error(message, sanitizeMeta(meta));
      }
    },
  };
}

/**
 * Sanitize metadata to mask sensitive information
 */
function sanitizeMeta(meta?: Record<string, any>): Record<string, any> | undefined {
  if (!meta) return undefined;

  const sanitized = { ...meta };
  const sensitiveKeys = [
    'apiKey',
    'api_key',
    'token',
    'password',
    'secret',
    'authorization',
    'bearer',
  ];

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      sanitized[key] = '***REDACTED***';
    }
  }

  return sanitized;
}

/**
 * Get the main logger instance (for testing or advanced use)
 */
export function getMainLogger(): winston.Logger {
  return mainLogger;
}

/**
 * Default export for convenience
 */
export default createLogger('default');
