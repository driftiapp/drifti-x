import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { initializeSentry, sentryMiddleware, sentryErrorHandler } from './config/sentry';
import { errorHandler } from './middlewares/error.middleware';
import { rateLimiter } from './middlewares/rate-limiter.middleware';
import { requestLogger } from './middlewares/logger.middleware';
import { correlationMiddleware } from './middlewares/correlation.middleware';
import { config } from './config/config';
import { liquorDeliveryRoutes } from './routes/liquorDelivery.routes';
import smokeShopRoutes from './routes/smokeShop.routes';

// Initialize Sentry
initializeSentry();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(correlationMiddleware);
app.use(requestLogger);
app.use(rateLimiter);
app.use(sentryMiddleware);

// Routes
app.use('/api/v1/liquor', liquorDeliveryRoutes);
app.use('/api/v1/smoke-shop', smokeShopRoutes);

// Error handling
app.use(sentryErrorHandler);
app.use(errorHandler);

export default app; 