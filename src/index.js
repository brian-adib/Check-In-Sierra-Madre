import express from 'express';
import { env } from './config/env.js';
import { requestLogger } from './middlewares/logger.middleware.js';
import { logger } from './config/logger.js'; // <-- Línea faltante

const app = express();

// Middlewares
app.use(express.json());
app.use(requestLogger);

// Test route
app.get('/ping', (req, res) => {
  res.status(200).json({ success: true, message: 'pong' });
});

// Start server
app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});