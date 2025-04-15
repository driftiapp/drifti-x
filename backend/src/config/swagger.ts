import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUiExpress from 'swagger-ui-express';
import { config } from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Device Trust API',
      version: '1.0.0',
      description: 'API for managing trusted devices and authentication',
    },
    servers: [
      {
        url: config.appUrl,
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        TrustedDevice: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the device trust record',
            },
            deviceId: {
              type: 'string',
              description: 'Unique identifier for the device',
            },
            deviceName: {
              type: 'string',
              description: 'User-defined name for the device',
              nullable: true,
            },
            deviceType: {
              type: 'string',
              description: 'Type of device (mobile, desktop, etc.)',
            },
            os: {
              type: 'string',
              description: 'Operating system of the device',
            },
            browser: {
              type: 'string',
              description: 'Browser used on the device',
            },
            lastIp: {
              type: 'string',
              description: 'Last known IP address of the device',
            },
            lastSeen: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp of last device activity',
            },
            firstSeen: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when device was first registered',
            },
            isTrusted: {
              type: 'boolean',
              description: 'Whether the device is trusted',
            },
          },
        },
        DeviceResponse: {
          type: 'object',
          properties: {
            devices: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/TrustedDevice',
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            code: {
              type: 'integer',
              description: 'HTTP status code',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: any) => {
  app.use(
    '/api/docs',
    (req: any, res: any, next: any) => {
      // Check if user is authenticated and has admin role
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
      next();
    },
    swaggerUiExpress.serve,
    swaggerUiExpress.setup(specs, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    })
  );
}; 