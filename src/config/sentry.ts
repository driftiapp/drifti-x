import * as Sentry from '@sentry/node';
import { config } from './config';

export const initializeSentry = () => {
  if (config.sentryDsn) {
    Sentry.init({
      dsn: config.sentryDsn,
      environment: config.nodeEnv,
      tracesSampleRate: config.isProduction ? 0.1 : 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express(),
      ],
    });
  }
};

export const sentryMiddleware = (req: any, res: any, next: any) => {
  if (config.sentryDsn) {
    Sentry.setUser({
      ip_address: req.ip,
    });
  }
  next();
};

export const sentryErrorHandler = (err: any, req: any, res: any, next: any) => {
  if (config.sentryDsn) {
    Sentry.captureException(err);
  }
  next(err);
}; 