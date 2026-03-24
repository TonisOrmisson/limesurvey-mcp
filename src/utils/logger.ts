import winston from 'winston';
import path from 'path';
import { encode } from '@toon-format/toon';

// Configure the Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'mcp-limesurvey' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      // MCP stdio transport uses stdout for protocol frames; route all app logs to stderr.
      stderrLevels: ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'],
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? encode(meta) : ''}`;
        })
      ),
    }),
    // Write logs with level 'info' and below to 'logs/combined.log'
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'combined.log')
    }),
    // Write only 'error' logs to 'logs/error.log'
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'error.log'), 
      level: 'error' 
    }),
  ],
});

// Create a stream object for Morgan integration (if needed later)
const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export { logger, stream };
