import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface MaintenanceResult {
  fixed: string[];
  deleted: string[];
  needsReview: string[];
  errors: string[];
}

class BackendMaintenance {
  private readonly srcDir: string;
  private readonly result: MaintenanceResult;
  private readonly cleanupLogPath: string;

  constructor() {
    this.srcDir = path.join(__dirname, '..');
    this.result = {
      fixed: [],
      deleted: [],
      needsReview: [],
      errors: []
    };
    this.cleanupLogPath = path.join(__dirname, '..', '..', 'cleanup.log');
  }

  public async logToFile(message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    await fs.promises.appendFile(
      this.cleanupLogPath,
      `[${timestamp}] ${message}\n`
    );
  }

  private async scanDirectory(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await this.scanDirectory(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private async checkImports(filePath: string): Promise<void> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
    const imports = [...content.matchAll(importRegex)].map(match => match[1]);

    for (const imp of imports) {
      try {
        const resolvedPath = require.resolve(imp, { paths: [this.srcDir] });
        if (!fs.existsSync(resolvedPath)) {
          this.result.needsReview.push(`Missing import in ${filePath}: ${imp}`);
          await this.logToFile(`Missing import in ${filePath}: ${imp}`);
        }
      } catch (error) {
        this.result.errors.push(`Error resolving import in ${filePath}: ${imp}`);
        await this.logToFile(`Error resolving import in ${filePath}: ${imp}`);
      }
    }
  }

  private async checkUnusedExports(filePath: string): Promise<void> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const exportRegex = /export\s+(?:const|function|class|interface|type)\s+(\w+)/g;
    const exports = [...content.matchAll(exportRegex)].map(match => match[1]);

    for (const exp of exports) {
      const grepCommand = `grep -r "${exp}" --include="*.ts" "${this.srcDir}" | grep -v "${filePath}"`;
      try {
        const { stdout } = await execAsync(grepCommand);
        if (!stdout.trim()) {
          this.result.needsReview.push(`Unused export in ${filePath}: ${exp}`);
          await this.logToFile(`Unused export in ${filePath}: ${exp}`);
        }
      } catch (error) {
        // grep returns non-zero when no matches are found
        this.result.needsReview.push(`Unused export in ${filePath}: ${exp}`);
        await this.logToFile(`Unused export in ${filePath}: ${exp}`);
      }
    }
  }

  private async checkRouteControllerConnections(): Promise<void> {
    const routesDir = path.join(this.srcDir, 'routes');
    const controllersDir = path.join(this.srcDir, 'controllers');

    const routeFiles = await this.scanDirectory(routesDir);
    for (const routeFile of routeFiles) {
      const content = await fs.promises.readFile(routeFile, 'utf-8');
      const controllerRegex = /from\s+['"](.*?\/controllers\/.*?)['"]/;
      const match = content.match(controllerRegex);

      if (match) {
        const controllerPath = path.join(this.srcDir, match[1].replace(/\.\.\//g, ''));
        if (!fs.existsSync(controllerPath)) {
          this.result.errors.push(`Missing controller for route: ${routeFile}`);
          await this.logToFile(`Missing controller for route: ${routeFile}`);
        }
      }
    }
  }

  private async mergeDuplicateDirectories(): Promise<void> {
    const middlewareDir = path.join(this.srcDir, 'middleware');
    const middlewaresDir = path.join(this.srcDir, 'middlewares');

    if (fs.existsSync(middlewareDir) && fs.existsSync(middlewaresDir)) {
      const middlewareFiles = await this.scanDirectory(middlewareDir);
      for (const file of middlewareFiles) {
        const relativePath = path.relative(middlewareDir, file);
        const targetPath = path.join(middlewaresDir, relativePath);
        
        if (!fs.existsSync(targetPath)) {
          await fs.promises.rename(file, targetPath);
          this.result.fixed.push(`Moved ${file} to ${targetPath}`);
          await this.logToFile(`Moved ${file} to ${targetPath}`);
        }
      }
      
      await fs.promises.rmdir(middlewareDir, { recursive: true });
      this.result.deleted.push(`Removed duplicate directory: ${middlewareDir}`);
      await this.logToFile(`Removed duplicate directory: ${middlewareDir}`);
    }
  }

  public async runMaintenance(): Promise<void> {
    try {
      logger.info('Starting backend maintenance...');
      await this.logToFile('Starting backend maintenance...');

      // Scan all TypeScript files
      const files = await this.scanDirectory(this.srcDir);
      
      // Check imports and exports
      for (const file of files) {
        await this.checkImports(file);
        await this.checkUnusedExports(file);
      }

      // Check route-controller connections
      await this.checkRouteControllerConnections();

      // Merge duplicate directories
      await this.mergeDuplicateDirectories();

      // Log results
      logger.info('Maintenance completed. Results:');
      logger.info(`Fixed: ${this.result.fixed.length} items`);
      logger.info(`Deleted: ${this.result.deleted.length} items`);
      logger.info(`Needs review: ${this.result.needsReview.length} items`);
      logger.info(`Errors: ${this.result.errors.length} items`);

      await this.logToFile('\nMaintenance Results:');
      await this.logToFile(`Fixed: ${this.result.fixed.join('\n')}`);
      await this.logToFile(`Deleted: ${this.result.deleted.join('\n')}`);
      await this.logToFile(`Needs review: ${this.result.needsReview.join('\n')}`);
      await this.logToFile(`Errors: ${this.result.errors.join('\n')}`);

    } catch (error) {
      logger.error('Error during maintenance:', error);
      await this.logToFile(`Error during maintenance: ${error}`);
    }
  }
}

// Create and run maintenance
const maintenance = new BackendMaintenance();

// Run maintenance immediately
maintenance.runMaintenance();

// Set up file watcher
const chokidar = require('chokidar');
const watcher = chokidar.watch(path.join(__dirname, '..'), {
  ignored: /(^|[\/\\])\../,
  persistent: true
});

watcher.on('change', (path: string) => {
  logger.info(`File changed: ${path}`);
  maintenance.runMaintenance();
});

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('Shutting down maintenance...');
  await maintenance.logToFile('Maintenance shutdown');
  process.exit(0);
});

// Replace require() with dynamic import
const loadModule = async (modulePath) => {
  const module = await import(modulePath);
  return module.default || module;
}; 