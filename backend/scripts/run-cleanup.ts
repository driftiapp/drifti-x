import { cleanupLogger } from '../src/utils/cleanupLogger';
import { MonitorCrashHandler } from '../src/utils/monitorCrashHandler';

// Initialize crash handler
new MonitorCrashHandler();

// Import the cleanup monitor after crash handler is initialized
import('./cleanup-monitor').catch(error => {
  cleanupLogger.error('Failed to start cleanup monitor:', { error });
  process.exit(1);
}); 