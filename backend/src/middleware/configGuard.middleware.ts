import { config } from '../config/app.config';
import { logger } from '../utils/logger';

export class ConfigGuard {
  private static instance: ConfigGuard;
  private validated = false;

  private constructor() {}

  public static getInstance(): ConfigGuard {
    if (!ConfigGuard.instance) {
      ConfigGuard.instance = new ConfigGuard();
    }
    return ConfigGuard.instance;
  }

  public validate(): void {
    if (this.validated) return;

    const criticalConfigs = [
      { key: 'security.jwt.secret', value: config.security.jwt.secret },
      { key: 'services.slack.webhookUrl', value: config.services.slack.webhookUrl },
      { key: 'database.url', value: config.database.url },
      { key: 'email.host', value: config.email.host },
      { key: 'email.port', value: config.email.port },
      { key: 'email.user', value: config.email.user },
      { key: 'email.pass', value: config.email.pass },
    ];

    const missingConfigs = criticalConfigs.filter(({ value }) => !value);

    if (missingConfigs.length > 0) {
      const missingKeys = missingConfigs.map(({ key }) => key).join(', ');
      logger.error('Critical configurations missing:', { missingKeys });
      throw new Error(`Critical configurations missing: ${missingKeys}`);
    }

    // Validate Redis URL if queue is enabled
    if (config.services.redis?.url) {
      try {
        new URL(config.services.redis.url);
      } catch (error) {
        logger.error('Invalid Redis URL:', { url: config.services.redis.url });
        throw new Error('Invalid Redis URL configuration');
      }
    }

    this.validated = true;
    logger.info('Configuration validation passed');
  }
} 