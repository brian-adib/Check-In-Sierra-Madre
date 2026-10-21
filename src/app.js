import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

import { requestLogger } from './middlewares/logger.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import healthRoute from './routes/health.route.js';
import mockRoute from './routes/mock.route.js';
import checkinRoute from './routes/checkin.route.js';
import swaggerDocument from '../docs/swagger.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'ERR_TOO_MANY_REQUESTS', message: 'Too many requests.' } }
}));
app.use(express.json());
app.use(requestLogger);

// Servir archivos estáticos del Frontend
app.use(express.static(path.join(__dirname, '../public')));

// Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/health', healthRoute);
app.use('/api/mock', mockRoute);
app.use('/api/check-in', checkinRoute);

// Error Handling
app.use('/api', notFoundHandler);
app.use(errorHandler);

export default app;