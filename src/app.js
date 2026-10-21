import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { requestLogger } from './middlewares/logger.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import healthRoute from './routes/health.route.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: { code: 'ERR_TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' }
  }
});
app.use(limiter);

app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/health', healthRoute);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;