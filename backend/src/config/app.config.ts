import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

// Define environment schema
const envSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number),
  
  // Security
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  COOKIE_SECRET: z.string().min(32),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // Application
  APP_URL: z.string().url(),
  APP_NAME: z.string().default('Driftix'),
  
  // Email
  EMAIL_HOST: z.string(),
  EMAIL_PORT: z.string().transform(Number),
  EMAIL_USER: z.string(),
  EMAIL_PASS: z.string(),
  EMAIL_FROM: z.string().email(),
  EMAIL_SUPPORT: z.string().email().default('support@driftix.com'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number),
  RATE_LIMIT_MAX: z.string().transform(Number),
  
  // CORS
  CORS_ORIGIN: z.string(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // External Services
  IPINFO_TOKEN: z.string(),
  SLACK_WEBHOOK_URL: z.string().url(),
  
  // Redis (optional, for queue)
  REDIS_URL: z.string().url().optional(),
});

// Parse environment variables
const env = envSchema.parse(process.env);

// Export configuration interface
export interface IConfig {
  env: {
    name: string;
    isDev: boolean;
    isProd: boolean;
    isTest: boolean;
  };
  app: {
    name: string;
    url: string;
    port: number;
  };
  security: {
    jwt: {
      secret: string;
      expiresIn: string;
    };
    cookie: {
      secret: string;
    };
  };
  database: {
    url: string;
  };
  email: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    support: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  cors: {
    origin: string;
  };
  logLevel: string;
  services: {
    ipinfo: {
      token: string;
    };
    slack: {
      webhookUrl: string;
    };
    redis?: {
      url: string;
    };
  };
}

// Export configuration
export const config: IConfig = {
  env: {
    name: env.NODE_ENV,
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },
  app: {
    name: env.APP_NAME,
    url: env.APP_URL,
    port: env.PORT,
  },
  security: {
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
    },
    cookie: {
      secret: env.COOKIE_SECRET,
    },
  },
  database: {
    url: env.DATABASE_URL,
  },
  email: {
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
    from: env.EMAIL_FROM,
    support: env.EMAIL_SUPPORT,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
  logLevel: env.LOG_LEVEL,
  services: {
    ipinfo: {
      token: env.IPINFO_TOKEN,
    },
    slack: {
      webhookUrl: env.SLACK_WEBHOOK_URL,
    },
    ...(env.REDIS_URL && {
      redis: {
        url: env.REDIS_URL,
      },
    }),
  },
}; 