import chokidar from 'chokidar';
import { exec } from 'child_process';
import { promisify } from 'util';
import { cleanupLogger } from '../src/utils/cleanupLogger';
import { config } from '../src/config/config';
import { MonitorCrashHandler } from '../src/utils/monitorCrashHandler';

const execAsync = promisify(exec);

class CleanupMonitor {
  private isRunning = false;
  private cleanupProcess: any = null;
  private readonly cleanupScript = 'ts-node scripts/cleanup.ts';
  private readonly typeCheckCommand = 'tsc --noEmit';
  private readonly lintCommand = 'eslint . --ext .ts,.tsx --fix';
  private readonly watchPatterns = config.cleanup.watchPatterns;

  constructor() {
    // Initialize crash handler
    new MonitorCrashHandler();
    this.start();
  }

  private async start() {
    if (this.isRunning) {
      cleanupLogger.warn('Cleanup monitor is already running');
      return;
    }

    this.isRunning = true;
    cleanupLogger.info('Starting cleanup monitor...');

    try {
      // Initial type check
      await this.runTypeCheck();
      
      // Initial linting
      await this.runLinting();
      
      // Start cleanup script
      await this.startCleanupScript();
      
      // Start file watching
      this.startFileWatching();
    } catch (error) {
      cleanupLogger.errorDetected(error, 'monitor startup');
      this.isRunning = false;
      throw error;
    }
  }

  private async runTypeCheck() {
    try {
      cleanupLogger.info('Running type check...');
      const { stderr } = await execAsync(this.typeCheckCommand);
      
      if (stderr) {
        cleanupLogger.errorDetected(stderr, 'type checking');
        return false;
      }
      
      cleanupLogger.info('Type checking completed successfully');
      return true;
    } catch (error) {
      cleanupLogger.errorDetected(error, 'type checking');
      return false;
    }
  }

  private async runLinting() {
    try {
      cleanupLogger.info('Running linting...');
      const { stderr } = await execAsync(this.lintCommand);
      
      if (stderr) {
        cleanupLogger.errorDetected(stderr, 'linting');
        return false;
      }
      
      cleanupLogger.info('Linting completed successfully');
      return true;
    } catch (error) {
      cleanupLogger.errorDetected(error, 'linting');
      return false;
    }
  }

  private async startCleanupScript() {
    try {
      cleanupLogger.info('Starting cleanup script...');
      
      if (this.cleanupProcess) {
        this.cleanupProcess.kill();
      }

      this.cleanupProcess = exec(this.cleanupScript);
      
      this.cleanupProcess.stdout?.on('data', (data: string) => {
        cleanupLogger.info(`Cleanup: ${data.trim()}`);
      });
      
      this.cleanupProcess.stderr?.on('data', (data: string) => {
        cleanupLogger.errorDetected(data.trim(), 'cleanup script');
      });
      
      this.cleanupProcess.on('close', (code: number) => {
        if (code !== 0) {
          cleanupLogger.errorDetected(`Process exited with code ${code}`, 'cleanup script');
          this.restartCleanupScript();
        }
      });
    } catch (error) {
      cleanupLogger.errorDetected(error, 'cleanup script startup');
      this.restartCleanupScript();
    }
  }

  private restartCleanupScript() {
    cleanupLogger.info('Restarting cleanup script...');
    setTimeout(() => this.startCleanupScript(), 5000);
  }

  private startFileWatching() {
    cleanupLogger.info('Starting file watcher...');
    
    const watcher = chokidar.watch(this.watchPatterns, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('add', path => {
        cleanupLogger.fileChange(path, 'added');
        this.runCleanup();
      })
      .on('change', path => {
        cleanupLogger.fileChange(path, 'changed');
        this.runCleanup();
      })
      .on('unlink', path => {
        cleanupLogger.fileChange(path, 'removed');
        this.runCleanup();
      })
      .on('error', error => {
        cleanupLogger.errorDetected(error, 'file watcher');
      });

    cleanupLogger.info('File watcher started successfully');
  }

  private async runCleanup() {
    try {
      cleanupLogger.cleanupStart();
      
      // Run type checking
      await this.runTypeCheck();
      
      // Run linting
      await this.runLinting();
      
      // Restart cleanup script
      await this.startCleanupScript();
      
      cleanupLogger.cleanupComplete({
        timestamp: new Date().toISOString(),
        status: 'success'
      });
    } catch (error) {
      cleanupLogger.errorDetected(error, 'cleanup cycle');
    }
  }
}

// Start the cleanup monitor
new CleanupMonitor(); 