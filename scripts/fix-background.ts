import { execSync } from 'child_process';
import { watch } from 'chokidar';
import { join } from 'path';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { format } from 'date-fns';
import * as ts from 'typescript';
import { createSourceFile, ScriptTarget, SyntaxKind, Node, InterfaceDeclaration, TypeAliasDeclaration } from 'typescript';

export interface FixLog {
  timestamp: string;
  file: string;
  issue: string;
  fix: string;
  status: FixStatus;
  category: FixCategory;
  severity: 'low' | 'medium' | 'high';
  testCoverage?: number;
  churnFactor?: number;
  complexity?: number;
  isCriticalPath?: boolean;
  author?: string;
}

export enum FixCategory {
  IMPORT = 'import',
  TYPE = 'type',
  LINT = 'lint',
  STYLE = 'style',
  SECURITY = 'security',
  PERFORMANCE = 'performance'
}

export enum FixStatus {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  PENDING = 'pending'
}

interface SmartFixPattern {
  name: string;
  pattern: RegExp;
  fix: (content: string) => string;
  category: FixCategory;
}

interface TypeDefinition {
  name: string;
  content: string;
  file: string;
}

class CodeFixer {
  private fixLog: FixLog[] = [];
  private fixLogPath = '.fixlog.json';
  private typeDefinitions: Map<string, TypeDefinition[]> = new Map();
  private riskScores: Map<string, number> = new Map();

  private smartFixPatterns: SmartFixPattern[] = [
    {
      name: 'Remove unused imports',
      pattern: /import\s+.*?from\s+['"].*?['"];?\s*(?=\n|$)/g,
      fix: (content: string) => content.replace(/import\s+.*?from\s+['"].*?['"];?\s*(?=\n|$)/g, ''),
      category: FixCategory.IMPORT
    },
    {
      name: 'Fix any type usage',
      pattern: /:\s*any\b/g,
      fix: (content: string) => content.replace(/:\s*any\b/g, ': unknown'),
      category: FixCategory.TYPE
    },
    {
      name: 'Fix duplicate types',
      pattern: /type\s+(\w+)\s*=\s*([^;]+);/g,
      fix: (content: string) => {
        const typeMap = new Map<string, string>();
        return content.replace(/type\s+(\w+)\s*=\s*([^;]+);/g, (match, name, definition) => {
          if (typeMap.has(definition)) {
            return `type ${name} = ${typeMap.get(definition)};`;
          }
          typeMap.set(definition, name);
          return match;
        });
      },
      category: FixCategory.TYPE
    },
    {
      name: 'Fix import paths',
      pattern: /import\s+.*?from\s+['"]@\/(.*?)['"]/g,
      fix: (content: string) => content.replace(/import\s+.*?from\s+['"]@\/(.*?)['"]/g, (match, path) => {
        return match.replace('@/', './');
      }),
      category: FixCategory.IMPORT
    },
    {
      name: 'Fix async functions',
      pattern: /async\s+function\s+(\w+)\s*\(/g,
      fix: (content: string) => content.replace(/async\s+function\s+(\w+)\s*\(/g, (match, name) => {
        return `async function ${name}(`;
      }),
      category: FixCategory.PERFORMANCE
    },
    {
      name: 'Fix deprecated patterns',
      pattern: /app\.use\(bodyParser\.json\(\)\)/g,
      fix: (content: string) => content.replace(/app\.use\(bodyParser\.json\(\)\)/g, 'app.use(express.json())'),
      category: FixCategory.SECURITY
    },
    {
      name: 'Fix naming conventions',
      pattern: /const\s+([a-z][a-zA-Z0-9]*)\s*=/g,
      fix: (content: string) => content.replace(/const\s+([a-z][a-zA-Z0-9]*)\s*=/g, (match, name) => {
        return `const ${name.charAt(0).toUpperCase() + name.slice(1)} =`;
      }),
      category: FixCategory.STYLE
    },
    {
      name: 'Fix async/await usage',
      pattern: /\.then\(/g,
      fix: (content: string) => content.replace(/\.then\(/g, 'await '),
      category: FixCategory.PERFORMANCE
    }
  ];

  constructor() {
    this.loadFixLog();
    this.calculateRiskScores();
  }

  private loadFixLog() {
    if (existsSync(this.fixLogPath)) {
      this.fixLog = JSON.parse(readFileSync(this.fixLogPath, 'utf-8'));
    }
  }

  private saveFixLog() {
    writeFileSync(this.fixLogPath, JSON.stringify(this.fixLog, null, 2));
  }

  private async getGitBlame(file: string, line: number): Promise<string> {
    try {
      const output = execSync(`git blame -L ${line},${line} ${file}`, { encoding: 'utf-8' });
      const match = output.match(/\(([^)]+)\)/);
      return match ? match[1] : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private async runLinter() {
    try {
      execSync('npm run lint', { stdio: 'inherit' });
      return true;
    } catch (error) {
      console.error('Linting failed:', error);
      return false;
    }
  }

  private async runTypeCheck() {
    try {
      execSync('npm run type-check', { stdio: 'inherit' });
      return true;
    } catch (error) {
      console.error('Type checking failed:', error);
      return false;
    }
  }

  private async runTests() {
    try {
      execSync('npm test', { stdio: 'inherit' });
      return true;
    } catch (error) {
      console.error('Tests failed:', error);
      return false;
    }
  }

  private logFix(file: string, issue: string, fix: string, status: FixStatus, category: FixCategory, severity: 'low' | 'medium' | 'high' = 'low'): void {
    this.fixLog.push({
      timestamp: new Date().toISOString(),
      file,
      issue,
      fix,
      status,
      category,
      severity
    });
  }

  private async calculateFileMetrics(filePath: string): Promise<Partial<FixLog>> {
    const metrics: Partial<FixLog> = {};

    // Calculate test coverage
    try {
      const coverage = execSync(`npx jest --coverage --collectCoverageFrom=${filePath}`, { encoding: 'utf-8' });
      const match = coverage.match(/Lines\s*:\s*(\d+\.\d+)%/);
      if (match) {
        metrics.testCoverage = parseFloat(match[1]);
      }
    } catch {
      metrics.testCoverage = 0;
    }

    // Calculate churn factor (commits in last 30 days)
    try {
      const churn = execSync(`git log --since="30 days ago" --pretty=format: --name-only ${filePath} | wc -l`, { encoding: 'utf-8' });
      metrics.churnFactor = parseInt(churn.trim(), 10);
    } catch {
      metrics.churnFactor = 0;
    }

    // Check if file is in critical path
    const criticalPaths = ['auth', 'payment', 'order'];
    metrics.isCriticalPath = criticalPaths.some(path => filePath.includes(path));

    return metrics;
  }

  private updateRiskScore(file: string) {
    const fileFixes = this.fixLog.filter(fix => fix.file === file);
    const metrics = fileFixes[0]; // Get the latest metrics

    const baseScore = fileFixes.reduce((acc, fix) => {
      const severityScore = {
        low: 1,
        medium: 2,
        high: 3
      }[fix.severity];
      return acc + severityScore;
    }, 0);

    // Apply multipliers based on metrics
    let riskScore = baseScore;

    // Test coverage impact
    if (metrics.testCoverage && metrics.testCoverage < 80) {
      riskScore *= (100 - metrics.testCoverage) / 20;
    }

    // Churn factor impact
    if (metrics.churnFactor && metrics.churnFactor > 5) {
      riskScore *= 1.5;
    }

    // Critical path impact
    if (metrics.isCriticalPath) {
      riskScore *= 2;
    }

    this.riskScores.set(file, Math.round(riskScore));
  }

  private calculateRiskScores() {
    const uniqueFiles = new Set(this.fixLog.map(fix => fix.file));
    uniqueFiles.forEach(file => this.updateRiskScore(file));
  }

  private async applySmartFixes(file: string): Promise<void> {
    const content = readFileSync(file, 'utf-8');
    let updatedContent = content;

    for (const pattern of this.smartFixPatterns) {
      if (pattern.pattern.test(content)) {
        updatedContent = pattern.fix(updatedContent);
        this.logFix(
          file,
          `Found ${pattern.name}`,
          `Applied ${pattern.name} fix`,
          FixStatus.AUTOMATIC,
          pattern.category
        );
      }
    }

    if (updatedContent !== content) {
      writeFileSync(file, updatedContent);
    }
  }

  public getRiskScore(file: string): number {
    return this.riskScores.get(file) || 0;
  }

  public async scanAndFix(moduleName?: string) {
    console.log('Starting codebase scan and fix...');
    
    const filesToScan = moduleName 
      ? [`src/${moduleName}/**/*.ts`]
      : ['src/**/*.ts', 'tests/**/*.ts'];

    const watcher = watch(filesToScan, {
      ignored: /(^|[\/\\])\../,
      persistent: false
    });

    watcher.on('change', async (path) => {
      console.log(`File ${path} changed. Running fixes...`);
      await this.applySmartFixes(path);
    });

    // Run linter with auto-fix
    console.log('Running linter...');
    const lintSuccess = await this.runLinter();
    if (!lintSuccess) {
      this.logFix('all', 'linting', 'npm run lint', FixStatus.MANUAL, FixCategory.LINT, 'medium');
    }

    // Run type checking
    console.log('Running type checking...');
    const typeCheckSuccess = await this.runTypeCheck();
    if (!typeCheckSuccess) {
      this.logFix('all', 'type checking', 'npm run type-check', FixStatus.MANUAL, FixCategory.TYPE, 'high');
    }

    // Run tests only for changed files if module specified
    if (moduleName) {
      console.log(`Running tests for module ${moduleName}...`);
      const testSuccess = await this.runTests();
      if (!testSuccess) {
        this.logFix(moduleName, 'tests', 'npm test', FixStatus.MANUAL, FixCategory.PERFORMANCE, 'high');
      }
    }

    console.log('Scan complete. Check .fixlog.json for details.');
  }

  public startWatching() {
    console.log('Starting file watcher...');
    const watcher = watch(['src/**/*.ts', 'tests/**/*.ts'], {
      ignored: /(^|[\/\\])\../,
      persistent: true
    });

    watcher.on('change', async (path) => {
      console.log(`File ${path} changed. Running fixes...`);
      await this.scanAndFix();
    });
  }
}

// Main execution
const fixer = new CodeFixer();

// Parse command line arguments
const args = process.argv.slice(2);
const moduleArg = args.find(arg => arg.startsWith('--fix-module='));
const moduleName = moduleArg ? moduleArg.split('=')[1] : undefined;

// Run initial scan
fixer.scanAndFix(moduleName);

// Start watching for changes if no module specified
if (!moduleName) {
  fixer.startWatching();
} 