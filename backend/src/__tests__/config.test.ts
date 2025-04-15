import { config } from '../config';
import { setTestEnv, restoreEnv } from '../test/setup';

describe('Configuration', () => {
  beforeEach(() => {
    jest.resetModules();
    setTestEnv({
      PORT: '5000',
      NODE_ENV: 'development',
      MONGODB_URI: 'mongodb://localhost:27017/driftix',
      JWT_SECRET: 'test-secret',
      FRONTEND_URL: 'http://localhost:3000',
      LOG_LEVEL: 'info',
    });
  });

  afterEach(() => {
    restoreEnv();
  });

  it('should load default values when environment variables are not set', () => {
    setTestEnv({
      NODE_ENV: 'development'
    });
    jest.resetModules();
    const { config } = require('../config');

    expect(config.port).toBe(5000);
    expect(config.apiUrl).toBe('http://localhost:5000');
    expect(config.mongodbUri).toBe('mongodb://localhost:27017/driftix');
    expect(config.jwtSecret).toBe('your_secure_jwt_secret_here');
    expect(config.frontendUrl).toBe('http://localhost:3000');
    expect(config.environment).toBe('development');
    expect(config.logLevel).toBe('info');
  });

  it('should use environment variables when set', () => {
    jest.resetModules();
    const { config } = require('../config');

    expect(config.port).toBe(5000);
    expect(config.apiUrl).toBe('http://localhost:5000');
    expect(config.mongodbUri).toBe('mongodb://localhost:27017/driftix');
    expect(config.jwtSecret).toBe('test-secret');
    expect(config.frontendUrl).toBe('http://localhost:3000');
    expect(config.environment).toBe('development');
    expect(config.logLevel).toBe('info');
  });

  it('should validate environment values', () => {
    setTestEnv({
      ...process.env,
      NODE_ENV: 'invalid',
      LOG_LEVEL: 'invalid',
    });
    jest.resetModules();
    const { config } = require('../config');

    expect(config.environment).toBe('development');
    expect(config.logLevel).toBe('info');
  });

  it('should parse PORT as a number', () => {
    setTestEnv({
      ...process.env,
      PORT: '3000',
    });
    jest.resetModules();
    const { config } = require('../config');

    expect(config.port).toBe(3000);
    expect(typeof config.port).toBe('number');
  });
}); 