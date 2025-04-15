import express from 'express';
import { worker } from './slack.worker';
import { metrics } from './slack.worker';
import { logger } from '../utils/logger';

const app = express();
const port = 3001;

// Health check endpoint
app.get('/health', (req, res) => {
  if (!worker.isRunning()) {
    logger.error('Worker is not running');
    return res.status(500).json({ status: 'error', message: 'Worker is not running' });
  }
  res.json({ status: 'ok', message: 'Worker is running' });
});

// Metrics endpoint
app.get('/metrics', metrics);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Health check server error:', err);
  res.status(500).json({ status: 'error', message: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  logger.info(`Health check server running on port ${port}`);
}); 