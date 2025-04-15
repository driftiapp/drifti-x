import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir, stat, unlink, rmdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { createHash } from 'crypto';
import { logger } from '../src/utils/logger';
import { config } from '../src/config/config';

const execAsync = promisify(exec);

interface FileInfo {
  path: string;
  hash: string;
  size: number;
}

interface Duplicate {
  original: FileInfo;
  duplicate: FileInfo;
}

class ProjectCleanup {
  private readonly ignoredPaths = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.next',
    '*.log',
    '*.tmp'
  ];

  private readonly typeCheckCommand = 'tsc --noEmit';
  private readonly lintCommand = 'eslint . --ext .ts,.tsx --fix';
  private readonly duplicatePatterns = [
    /-copy$/i,
    /-fixed$/i,
    /-2$/i,
    /-backup$/i,
    /-old$/i,
    /-v\d+$/i
  ];

  constructor() {
    this.startMonitoring();
  }

  private async startMonitoring() {
    logger.info('Starting project cleanup monitor...');
    setInterval(() => this.runCleanup(), 300000); // 5 minutes
    await this.runCleanup();
  }

  private async runCleanup() {
    try {
      logger.info('Running cleanup cycle...');
      
      // Run type checking
      await this.checkTypes();
      
      // Run linting
      await this.runLinting();
      
      // Find and remove duplicates
      const duplicates = await this.findDuplicates();
      await this.removeDuplicates(duplicates);
      
      // Find unused files
      const unusedFiles = await this.findUnusedFiles();
      await this.removeUnusedFiles(unusedFiles);
      
      logger.info('Cleanup cycle completed successfully');
    } catch (error) {
      logger.error('Error during cleanup cycle:', error);
    }
  }

  private async checkTypes() {
    try {
      logger.info('Running type checking...');
      const { stdout, stderr } = await execAsync(this.typeCheckCommand);
      
      if (stderr) {
        logger.error('Type checking errors:', stderr);
        return false;
      }
      
      logger.info('Type checking completed successfully');
      return true;
    } catch (error) {
      logger.error('Type checking failed:', error);
      return false;
    }
  }

  private async runLinting() {
    try {
      logger.info('Running linting...');
      const { stdout, stderr } = await execAsync(this.lintCommand);
      
      if (stderr) {
        logger.error('Linting errors:', stderr);
        return false;
      }
      
      logger.info('Linting completed successfully');
      return true;
    } catch (error) {
      logger.error('Linting failed:', error);
      return false;
    }
  }

  private async findDuplicates(): Promise<Duplicate[]> {
    const duplicates: Duplicate[] = [];
    const fileMap = new Map<string, FileInfo[]>();
    
    await this.scanDirectory(process.cwd(), async (filePath) => {
      if (this.shouldIgnore(filePath)) return;
      
      const fileInfo = await this.getFileInfo(filePath);
      const existingFiles = fileMap.get(fileInfo.hash) || [];
      
      if (existingFiles.length > 0) {
        duplicates.push({
          original: existingFiles[0],
          duplicate: fileInfo
        });
      }
      
      existingFiles.push(fileInfo);
      fileMap.set(fileInfo.hash, existingFiles);
    });
    
    return duplicates;
  }

  private async removeDuplicates(duplicates: Duplicate[]) {
    for (const { duplicate } of duplicates) {
      if (this.isDuplicatePath(duplicate.path)) {
        logger.info(`Removing duplicate file: ${duplicate.path}`);
        await unlink(duplicate.path);
      }
    }
  }

  private async findUnusedFiles(): Promise<string[]> {
    const unusedFiles: string[] = [];
    const importMap = new Map<string, Set<string>>();
    
    // TODO: Implement import analysis
    // This would involve:
    // 1. Parsing all TypeScript files
    // 2. Building an import graph
    // 3. Finding files not imported by any other file
    // 4. Excluding entry points and configuration files
    
    return unusedFiles;
  }

  private async removeUnusedFiles(unusedFiles: string[]) {
    for (const filePath of unusedFiles) {
      if (this.shouldIgnore(filePath)) continue;
      
      logger.info(`Removing unused file: ${filePath}`);
      await unlink(filePath);
      
      // Try to remove parent directory if empty
      const parentDir = filePath.split('/').slice(0, -1).join('/');
      try {
        await rmdir(parentDir);
        logger.info(`Removed empty directory: ${parentDir}`);
      } catch (error) {
        // Directory not empty or other error
      }
    }
  }

  private async scanDirectory(dir: string, callback: (filePath: string) => Promise<void>) {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (this.shouldIgnore(fullPath)) continue;
      
      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath, callback);
      } else if (entry.isFile()) {
        await callback(fullPath);
      }
    }
  }

  private async getFileInfo(filePath: string): Promise<FileInfo> {
    const stats = await stat(filePath);
    const content = await readFile(filePath);
    const hash = createHash('sha256').update(content).digest('hex');
    
    return {
      path: filePath,
      hash,
      size: stats.size
    };
  }

  private shouldIgnore(path: string): boolean {
    return this.ignoredPaths.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(path);
      }
      return path.includes(pattern);
    });
  }

  private isDuplicatePath(path: string): boolean {
    return this.duplicatePatterns.some(pattern => pattern.test(path));
  }
}

// Start the cleanup process
new ProjectCleanup(); 