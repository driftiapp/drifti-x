import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/monitor.log' }),
    new winston.transports.Console()
  ]
});

// Create logs directory if it doesn't exist
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Watch for changes in frontend and backend
const watcher = chokidar.watch([
  'frontend/src/**/*',
  'backend/src/**/*'
], {
  ignored: /(^|[\/\\])\../,
  persistent: true
});

logger.info('Starting file monitor...');

watcher
  .on('add', path => logger.info(`File ${path} has been added`))
  .on('change', path => logger.info(`File ${path} has been changed`))
  .on('unlink', path => logger.info(`File ${path} has been removed`))
  .on('error', error => logger.error(`Watcher error: ${error}`));

// Keep the process running
process.on('SIGINT', () => {
  logger.info('Stopping file monitor...');
  watcher.close();
  process.exit();
}); 