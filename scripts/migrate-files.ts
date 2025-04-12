import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { execSync } from 'child_process';
import { FixLog, FixCategory, FixStatus } from './fix-background';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

interface MigrationLog {
  timestamp: string;
  file: string;
  status: 'success' | 'error';
  changes?: string[];
  error?: string;
}

interface MigrationFixLog {
  migrations: MigrationLog[];
  lastUpdate: string;
}

const SOURCE_DIR = path.resolve(process.cwd(), '..', 'driftixxd', 'driftix', 'backend', 'src');
const TARGET_DIR = path.resolve(process.cwd(), 'src');
const FIX_LOG_FILE = path.resolve(process.cwd(), '.fixlog.json');

console.log('Configuration:');
console.log('SOURCE_DIR:', SOURCE_DIR);
console.log('TARGET_DIR:', TARGET_DIR);
console.log('FIX_LOG_FILE:', FIX_LOG_FILE);

async function ensureDirectoryExists(dir: string): Promise<void> {
  console.log('Ensuring directory exists:', dir);
  if (!fs.existsSync(dir)) {
    console.log('Creating directory:', dir);
    await mkdir(dir, { recursive: true });
  }
}

async function ensureFixLogExists(): Promise<void> {
  console.log('Ensuring fix log exists');
  await ensureDirectoryExists(path.dirname(FIX_LOG_FILE));
  
  if (!fs.existsSync(FIX_LOG_FILE)) {
    console.log('Creating fix log file');
    const initialLog: MigrationFixLog = {
      migrations: [],
      lastUpdate: new Date().toISOString()
    };
    await writeFile(FIX_LOG_FILE, JSON.stringify(initialLog, null, 2));
  }
}

async function readFixLog(): Promise<MigrationFixLog> {
  console.log('Reading fix log');
  await ensureFixLogExists();
  const content = await readFile(FIX_LOG_FILE, 'utf8');
  const log = JSON.parse(content);
  console.log('Fix log content:', log);
  return log;
}

async function writeFixLog(log: MigrationFixLog): Promise<void> {
  console.log('Writing fix log');
  await ensureDirectoryExists(path.dirname(FIX_LOG_FILE));
  await writeFile(FIX_LOG_FILE, JSON.stringify(log, null, 2));
}

async function updateFixLog(log: MigrationLog): Promise<void> {
  console.log('Updating fix log with:', log);
  const fixLog = await readFixLog();
  console.log('Current fix log:', fixLog);
  fixLog.migrations.push(log);
  fixLog.lastUpdate = new Date().toISOString();
  await writeFixLog(fixLog);
}

async function fixImports(content: string): Promise<string> {
  // Convert @/ imports to relative paths
  return content.replace(/from ['"]@\//g, 'from \'../');
}

async function migrateFile(sourcePath: string, targetPath: string): Promise<void> {
  console.log('\nMigrating file:');
  console.log('Source:', sourcePath);
  console.log('Target:', targetPath);

  try {
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file not found: ${sourcePath}`);
    }

    const content = await readFile(sourcePath, 'utf8');
    const fixedContent = await fixImports(content);
    
    await ensureDirectoryExists(path.dirname(targetPath));
    await writeFile(targetPath, fixedContent);

    await updateFixLog({
      timestamp: new Date().toISOString(),
      file: targetPath,
      status: 'success',
      changes: ['Migrated file', 'Fixed imports']
    });

    // Run linter and type checker
    try {
      execSync('npm run lint', { stdio: 'inherit' });
      execSync('npm run type-check', { stdio: 'inherit' });
    } catch (error) {
      await updateFixLog({
        timestamp: new Date().toISOString(),
        file: targetPath,
        status: 'error',
        error: 'Linting or type checking failed'
      });
      throw error;
    }

    console.log(`✅ Successfully migrated ${path.basename(sourcePath)}`);
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error occurred';
    console.error(`❌ Failed to migrate ${path.basename(sourcePath)}: ${errorMessage}`);

    await updateFixLog({
      timestamp: new Date().toISOString(),
      file: targetPath,
      status: 'error',
      error: errorMessage
    });
  }
}

async function main() {
  try {
    console.log('\nStarting migration process');
    
    if (!fs.existsSync(SOURCE_DIR)) {
      throw new Error(`Source directory not found: ${SOURCE_DIR}`);
    }
    console.log('Source directory exists');

    await ensureFixLogExists();
    console.log('Fix log file ready');

    await ensureDirectoryExists(path.join(TARGET_DIR, 'middleware'));
    console.log('Target middleware directory ready');

    // Middleware files to migrate
    const middlewareFiles = [
      'isAdmin.ts',
      'correlation.ts',
      'logger.ts',
      'auth.ts',
      'validate.ts',
      'uploadMiddleware.ts',
      'authenticate.ts',
      'errorHandler.ts',
      'auth.middleware.ts'
    ];

    console.log('\n🚀 Starting migration...');
    console.log(`Source directory: ${SOURCE_DIR}`);
    console.log(`Target directory: ${TARGET_DIR}`);

    for (const file of middlewareFiles) {
      const sourcePath = path.join(SOURCE_DIR, 'middleware', file);
      const targetPath = path.join(TARGET_DIR, 'middleware', file);
      await migrateFile(sourcePath, targetPath);
    }

    console.log('\n🎉 Migration completed! Check .fixlog.json for details.');
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error?.message || 'Unknown error occurred');
    process.exit(1);
  }
}

main(); 