import { logger } from '../utils/logger';
import chokidar from 'chokidar';

export const setupFileMonitor = (): void => {
  try {
    const watcher = chokidar.watch('./src', {
      ignored: /(^|[\/\\])\../,
      persistent: true
    });

    watcher
      .on('add', path => logger.info(`File ${path} has been added`))
      .on('change', path => logger.info(`File ${path} has been changed`))
      .on('unlink', path => logger.info(`File ${path} has been removed`));

    logger.info('File monitoring initialized');
  } catch (error) {
    logger.error('Error setting up file monitoring:', error);
  }
}; 