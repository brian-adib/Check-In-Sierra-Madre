import { logger } from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'ERR_INTERNAL_SERVER';
  const message = err.message || 'Internal Server Error';

  logger.error({
    traceId: req.traceId,
    userId: req.userId,
    endpoint: `${req.method} ${req.originalUrl}`,
    latencyMs: 0,
    message: `Error handled: ${message}`,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    error: { code: errorCode, message: message },
  });
};

export const notFoundHandler = (req, res, next) => {
  const err = new Error('Endpoint not found');
  err.statusCode = 404;
  err.code = 'ERR_NOT_FOUND';
  next(err);
};