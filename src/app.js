import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { requestLogger } from './middlewares/logger.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import healthRoute from './routes/health.route.js';

// Load swagger.json directly
import swaggerDocument from '../docs/swagger.json' with { type: 'json' };

const app = express();

app.use(helmet());
app.use(cors());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'ERR_TOO_MANY_REQUESTS', message: 'Too many requests.' } }
}));
app.use(express.json());
app.use(requestLogger);

// Swagger UI Route
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes
app.use('/health', healthRoute);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;