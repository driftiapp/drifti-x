import { readdir, stat, readFile } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';
import { cleanupLogger } from '../src/utils/cleanupLogger';
import { config } from '../src/config/config';

interface FileInfo {
  path: string;
  hash: string;
  size: number;
}

interface Duplicate {
  original: FileInfo;
  duplicate: FileInfo;
}

class DuplicateChecker {
  private readonly ignoredPaths = config.cleanup.ignoredPaths;
  private readonly duplicatePatterns = [
    /-copy$/i,
    /-fixed$/i,
    /-2$/i,
    /-backup$/i,
    /-old$/i,
    /-v\d+$/i
  ];

  async run(): Promise<boolean> {
    try {
      cleanupLogger.info('Starting duplicate check...');
      
      const duplicates = await this.findDuplicates(process.cwd());
      
      if (duplicates.length > 0) {
        this.logDuplicates(duplicates);
        return false;
      }
      
      cleanupLogger.info('No duplicates found');
      return true;
    } catch (error) {
      cleanupLogger.error('Error checking for duplicates:', { error });
      return false;
    }
  }

  private async findDuplicates(dir: string): Promise<Duplicate[]> {
    const duplicates: Duplicate[] = [];
    const fileMap = new Map<string, FileInfo[]>();
    
    await this.scanDirectory(dir, async (filePath) => {
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

  private logDuplicates(duplicates: Duplicate[]) {
    cleanupLogger.error('Found duplicate files:', {
      count: duplicates.length,
      duplicates: duplicates.map(({ original, duplicate }) => ({
        original: original.path,
        duplicate: duplicate.path,
        size: duplicate.size
      }))
    });
  }
}

// Run the duplicate checker
const checker = new DuplicateChecker();
checker.run().then(success => {
  if (!success) {
    process.exit(1);
  }
}); 