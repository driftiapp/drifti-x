import { exec } from 'child_process';
import { promisify } from 'util';
import chokidar from 'chokidar';
import { cleanupLogger } from '../src/utils/cleanupLogger';
import { config } from '../src/config/config';

const execAsync = promisify(exec);

class CleanupMonitor {
  private isRunning = false;
  private cleanupProcess: any = null;
  private readonly cleanupScript = 'ts-node scripts/cleanup.ts';
  private readonly typeCheckCommand = 'tsc --noEmit';
  private readonly lintCommand = 'eslint . --ext .ts,.tsx --fix';
  private readonly watchPatterns = ['src/**/*.ts', 'src/**/*.tsx'];

  constructor() {
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
      cleanupLogger.error('Error starting cleanup monitor:', { error });
      this.isRunning = false;
    }
  }

  private async runTypeCheck() {
    try {
      cleanupLogger.info('Running type check...');
      const { stderr } = await execAsync(this.typeCheckCommand);
      
      if (stderr) {
        cleanupLogger.error('Type checking errors:', { errors: stderr });
        return false;
      }
      
      cleanupLogger.info('Type checking completed successfully');
      return true;
    } catch (error) {
      cleanupLogger.error('Type checking failed:', { error });
      return false;
    }
  }

  private async runLinting() {
    try {
      cleanupLogger.info('Running linting...');
      const { stderr } = await execAsync(this.lintCommand);
      
      if (stderr) {
        cleanupLogger.error('Linting errors:', { errors: stderr });
        return false;
      }
      
      cleanupLogger.info('Linting completed successfully');
      return true;
    } catch (error) {
      cleanupLogger.error('Linting failed:', { error });
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
        cleanupLogger.error(`Cleanup error: ${data.trim()}`);
      });
      
      this.cleanupProcess.on('close', (code: number) => {
        if (code !== 0) {
          cleanupLogger.error(`Cleanup script exited with code ${code}`);
          this.restartCleanupScript();
        }
      });
    } catch (error) {
      cleanupLogger.error('Error starting cleanup script:', { error });
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
      persistent: true
    });

    watcher
      .on('add', path => {
        cleanupLogger.info(`File added: ${path}`);
        this.runCleanup();
      })
      .on('change', path => {
        cleanupLogger.info(`File changed: ${path}`);
        this.runCleanup();
      })
      .on('unlink', path => {
        cleanupLogger.info(`File removed: ${path}`);
        this.runCleanup();
      })
      .on('error', error => {
        cleanupLogger.error('Watcher error:', { error });
      });

    cleanupLogger.info('File watcher started successfully');
  }

  private async runCleanup() {
    try {
      cleanupLogger.info('Running cleanup cycle...');
      
      // Run type checking
      await this.runTypeCheck();
      
      // Run linting
      await this.runLinting();
      
      // Restart cleanup script
      await this.startCleanupScript();
      
      cleanupLogger.info('Cleanup cycle completed successfully');
    } catch (error) {
      cleanupLogger.error('Error during cleanup cycle:', { error });
    }
  }
}

// Start the cleanup monitor
new CleanupMonitor(); 