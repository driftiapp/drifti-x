import { readFileSync, existsSync } from 'fs';
import { format, subDays, differenceInDays } from 'date-fns';

interface FixLog {
  timestamp: string;
  file: string;
  issue: string;
  fix: string;
  status: 'fixed' | 'manual' | 'skipped';
  category: 'type' | 'import' | 'syntax' | 'duplicate' | 'other';
}

interface FixMetrics {
  totalFixes: number;
  fixedCount: number;
  manualCount: number;
  skippedCount: number;
  byCategory: Record<string, number>;
  byFile: Record<string, number>;
  recentFixes: FixLog[];
  recurringIssues: Array<{ issue: string; count: number; lastFixed: string }>;
}

class FixAnalyzer {
  private fixLog: FixLog[] = [];
  private fixLogPath = '.fixlog.json';

  constructor() {
    this.loadFixLog();
  }

  private loadFixLog() {
    if (existsSync(this.fixLogPath)) {
      this.fixLog = JSON.parse(readFileSync(this.fixLogPath, 'utf-8'));
    }
  }

  private calculateMetrics(): FixMetrics {
    const metrics: FixMetrics = {
      totalFixes: this.fixLog.length,
      fixedCount: 0,
      manualCount: 0,
      skippedCount: 0,
      byCategory: {},
      byFile: {},
      recentFixes: [],
      recurringIssues: []
    };

    const issueCounts: Record<string, { count: number; lastFixed: string }> = {};

    this.fixLog.forEach(fix => {
      // Count by status
      if (fix.status === 'fixed') metrics.fixedCount++;
      if (fix.status === 'manual') metrics.manualCount++;
      if (fix.status === 'skipped') metrics.skippedCount++;

      // Count by category
      metrics.byCategory[fix.category] = (metrics.byCategory[fix.category] || 0) + 1;

      // Count by file
      metrics.byFile[fix.file] = (metrics.byFile[fix.file] || 0) + 1;

      // Track recurring issues
      if (!issueCounts[fix.issue]) {
        issueCounts[fix.issue] = { count: 0, lastFixed: fix.timestamp };
      }
      issueCounts[fix.issue].count++;
      if (new Date(fix.timestamp) > new Date(issueCounts[fix.issue].lastFixed)) {
        issueCounts[fix.issue].lastFixed = fix.timestamp;
      }
    });

    // Get recent fixes (last 7 days)
    const cutoffDate = subDays(new Date(), 7);
    metrics.recentFixes = this.fixLog.filter(fix => 
      new Date(fix.timestamp) >= cutoffDate
    );

    // Get recurring issues (appeared more than once)
    metrics.recurringIssues = Object.entries(issueCounts)
      .filter(([_, data]) => data.count > 1)
      .map(([issue, data]) => ({
        issue,
        count: data.count,
        lastFixed: data.lastFixed
      }))
      .sort((a, b) => b.count - a.count);

    return metrics;
  }

  private formatDuration(days: number): string {
    if (days < 1) return 'less than a day';
    if (days === 1) return '1 day';
    return `${days} days`;
  }

  public generateReport() {
    const metrics = this.calculateMetrics();
    
    console.log('=== Fix Analysis Report ===');
    console.log(`Total fixes recorded: ${metrics.totalFixes}`);
    console.log(`Fixed: ${metrics.fixedCount}, Manual: ${metrics.manualCount}, Skipped: ${metrics.skippedCount}`);
    
    console.log('\nFixes by Category:');
    Object.entries(metrics.byCategory)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`- ${category}: ${count} (${((count / metrics.totalFixes) * 100).toFixed(1)}%)`);
      });

    console.log('\nTop 5 Most Error-Prone Files:');
    Object.entries(metrics.byFile)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([file, count]) => {
        console.log(`- ${file}: ${count} issues`);
      });

    console.log('\nRecent Fixes (last 7 days):');
    metrics.recentFixes.forEach(fix => {
      const daysAgo = differenceInDays(new Date(), new Date(fix.timestamp));
      console.log(`- ${fix.timestamp} (${this.formatDuration(daysAgo)} ago):`);
      console.log(`  File: ${fix.file}`);
      console.log(`  Issue: ${fix.issue}`);
      console.log(`  Status: ${fix.status}`);
      console.log(`  Category: ${fix.category}`);
    });

    console.log('\nRecurring Issues:');
    metrics.recurringIssues.forEach(({ issue, count, lastFixed }) => {
      const daysSinceLastFix = differenceInDays(new Date(), new Date(lastFixed));
      console.log(`- ${issue}:`);
      console.log(`  Occurrences: ${count}`);
      console.log(`  Last fixed: ${lastFixed} (${this.formatDuration(daysSinceLastFix)} ago)`);
    });

    // Generate summary
    console.log('\n=== Summary ===');
    const mostCommonCategory = Object.entries(metrics.byCategory)
      .sort(([, a], [, b]) => b - a)[0];
    const mostErrorProneFile = Object.entries(metrics.byFile)
      .sort(([, a], [, b]) => b - a)[0];
    
    console.log(`Most common issue category: ${mostCommonCategory[0]} (${mostCommonCategory[1]} issues)`);
    console.log(`Most error-prone file: ${mostErrorProneFile[0]} (${mostErrorProneFile[1]} issues)`);
    console.log(`Recurring issues: ${metrics.recurringIssues.length}`);
    console.log(`Recent fixes: ${metrics.recentFixes.length} in the last 7 days`);
  }
}

// Main execution
const analyzer = new FixAnalyzer();
analyzer.generateReport(); 