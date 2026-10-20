import pino from 'pino';
import { env } from './env.js';

// Create the base logger instance
export const logger = pino({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  base: undefined, // Removes default pid and hostname for cleaner logs
});