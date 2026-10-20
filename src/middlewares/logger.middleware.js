import { randomUUID } from 'crypto';
import { logger } from '../config/logger.js';

export const requestLogger = (req, res, next) => {
  const start = process.hrtime();
  
  // Generate or use existing traceId
  req.traceId = req.headers['x-trace-id'] || randomUUID();
  res.setHeader('x-trace-id', req.traceId);
  
  // Placeholder for userId (will be dynamic once we add auth)
  req.userId = req.headers['x-user-id'] || 'anonymous';

  // Listen for the response to finish
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const latencyMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6); // Convert to ms

    // Strict log structure required by the brief
    logger.info({
      traceId: req.traceId,
      userId: req.userId,
      endpoint: `${req.method} ${req.originalUrl}`,
      latencyMs,
      message: 'Request processed',
    });
  });

  next();
};