import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

const SOURCE_DIR = path.resolve(process.cwd(), '..', 'driftixxd', 'driftix', 'backend', 'src');
const TARGET_DIR = path.resolve(process.cwd(), 'src');

async function ensureDirectoryExists(dir: string): Promise<void> {
  if (!fs.existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

async function copyFile(sourcePath: string, targetPath: string): Promise<void> {
  try {
    console.log(`Copying ${path.basename(sourcePath)}...`);
    const content = await readFile(sourcePath, 'utf8');
    await ensureDirectoryExists(path.dirname(targetPath));
    await writeFile(targetPath, content);
    console.log(`✅ Successfully copied ${path.basename(sourcePath)}`);
  } catch (error: any) {
    // If the .ts file doesn't exist, try .js
    if (error.code === 'ENOENT' && sourcePath.endsWith('.ts')) {
      const jsSourcePath = sourcePath.replace(/\.ts$/, '.js');
      try {
        console.log(`Trying JavaScript file: ${path.basename(jsSourcePath)}...`);
        const content = await readFile(jsSourcePath, 'utf8');
        await ensureDirectoryExists(path.dirname(targetPath));
        await writeFile(targetPath, content);
        console.log(`✅ Successfully copied and converted ${path.basename(jsSourcePath)} to TypeScript`);
      } catch (jsError: any) {
        console.error(`❌ Failed to copy ${path.basename(sourcePath)}: ${jsError?.message || 'Unknown error'}`);
      }
    } else {
      console.error(`❌ Failed to copy ${path.basename(sourcePath)}: ${error?.message || 'Unknown error'}`);
    }
  }
}

async function main() {
  try {
    if (!fs.existsSync(SOURCE_DIR)) {
      throw new Error(`Source directory not found: ${SOURCE_DIR}`);
    }

    const middlewareDir = path.join(TARGET_DIR, 'middleware');
    await ensureDirectoryExists(middlewareDir);

    const files = [
      'isAdmin.ts',
      'correlation.ts',
      'logger.ts',
      'auth.ts',
      'validate.ts',
      'uploadMiddleware.ts',
      'authenticate.ts',
      'errorHandler.ts',
      'auth.middleware.ts',
      'role.middleware.ts'
    ];

    console.log('\n🚀 Starting middleware migration...');
    console.log(`Source: ${SOURCE_DIR}`);
    console.log(`Target: ${TARGET_DIR}\n`);

    for (const file of files) {
      const sourcePath = path.join(SOURCE_DIR, 'middleware', file);
      const targetPath = path.join(middlewareDir, file);
      await copyFile(sourcePath, targetPath);
    }

    console.log('\n✨ Middleware migration completed!');
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error?.message || 'Unknown error');
    process.exit(1);
  }
}

main(); 