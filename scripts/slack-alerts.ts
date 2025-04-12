import { WebClient } from '@slack/web-api';
import { readFileSync, existsSync } from 'fs';
import { format, differenceInHours, differenceInDays } from 'date-fns';
import { execSync } from 'child_process';

interface FixLog {
  timestamp: string;
  file: string;
  issue: string;
  fix: string;
  status: 'fixed' | 'manual' | 'skipped';
  category: 'type' | 'import' | 'syntax' | 'duplicate' | 'other' | 'naming' | 'async' | 'deprecated' | 'security' | 'test' | 'dependency';
  severity: 'low' | 'medium' | 'high';
  author?: string;
  testCoverage?: number;
  churnFactor?: number;
  complexity?: number;
  isCriticalPath?: boolean;
  bugDensity?: number;
  contributorCount?: number;
  reviewFriction?: number;
  refactorabilityScore?: number;
  testPerformance?: number;
  testStability?: number;
  dependencyDrift?: number;
}

class SlackAlerts {
  private web: WebClient;
  private fixLogPath = '.fixlog.json';
  private channelId: string;
  private riskThreshold = 5;
  private testCoverageThreshold = 80;
  private churnThreshold = 5;
  private bugDensityThreshold = 0.1;
  private contributorThreshold = 3;
  private reviewFrictionThreshold = 0.3;
  private testPerformanceThreshold = 2000; // ms
  private testStabilityThreshold = 0.9; // 90% pass rate
  private dependencyDriftThreshold = 0.2; // 20% version difference

  constructor(token: string, channelId: string) {
    this.web = new WebClient(token);
    this.channelId = channelId;
  }

  private loadFixLog(): FixLog[] {
    if (existsSync(this.fixLogPath)) {
      return JSON.parse(readFileSync(this.fixLogPath, 'utf-8'));
    }
    return [];
  }

  private async getGitMetrics(file: string): Promise<Partial<FixLog>> {
    const metrics: Partial<FixLog> = {};
    
    try {
      // Get contributor count
      const contributors = execSync(`git log --format="%an" ${file} | sort | uniq | wc -l`, { encoding: 'utf-8' });
      metrics.contributorCount = parseInt(contributors.trim(), 10);

      // Get bug density (commits with "fix" or "bug" in message)
      const bugCommits = execSync(`git log --grep="fix\\|bug" --format="%H" ${file} | wc -l`, { encoding: 'utf-8' });
      const totalCommits = execSync(`git log --format="%H" ${file} | wc -l`, { encoding: 'utf-8' });
      metrics.bugDensity = parseInt(bugCommits.trim(), 10) / parseInt(totalCommits.trim(), 10);

      // Get review friction (time between first commit and merge)
      const reviewTime = execSync(`git log --merges --format="%ct" ${file} | head -n 1`, { encoding: 'utf-8' });
      const firstCommit = execSync(`git log --format="%ct" ${file} | tail -n 1`, { encoding: 'utf-8' });
      if (reviewTime && firstCommit) {
        metrics.reviewFriction = (parseInt(reviewTime.trim(), 10) - parseInt(firstCommit.trim(), 10)) / 3600; // hours
      }
    } catch (error) {
      console.error('Error getting git metrics:', error);
    }

    return metrics;
  }

  private async getTestMetrics(file: string): Promise<Partial<FixLog>> {
    const metrics: Partial<FixLog> = {};
    
    try {
      // Run tests for the file and capture performance
      const testOutput = execSync(`npm test -- --testPathPattern=${file} --json`, { encoding: 'utf-8' });
      const results = JSON.parse(testOutput);
      
      metrics.testPerformance = results.testResults[0]?.perfStats?.end - results.testResults[0]?.perfStats?.start;
      metrics.testStability = results.testResults[0]?.numPassingTests / results.testResults[0]?.numTotalTests;
    } catch (error) {
      console.error('Error getting test metrics:', error);
    }

    return metrics;
  }

  private async getDependencyMetrics(file: string): Promise<Partial<FixLog>> {
    const metrics: Partial<FixLog> = {};
    
    try {
      // Check package.json for dependency versions
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      const fileContent = readFileSync(file, 'utf-8');
      
      // Simple heuristic: count import statements with version numbers
      const importRegex = /from ['"]([^'"]+)['"]/g;
      const imports = [...fileContent.matchAll(importRegex)].map(m => m[1]);
      
      let driftCount = 0;
      for (const imp of imports) {
        const pkg = imp.split('/')[0];
        if (packageJson.dependencies[pkg] || packageJson.devDependencies[pkg]) {
          driftCount++;
        }
      }
      
      metrics.dependencyDrift = driftCount / imports.length;
    } catch (error) {
      console.error('Error getting dependency metrics:', error);
    }

    return metrics;
  }

  private calculateRiskScore(file: string, fixes: FixLog[]): number {
    const fileFixes = fixes.filter(fix => fix.file === file);
    const metrics = fileFixes[0];

    const baseScore = fileFixes.reduce((score, fix) => {
      const severityScore = {
        low: 1,
        medium: 2,
        high: 3
      }[fix.severity];
      return score + severityScore;
    }, 0);

    let riskScore = baseScore;

    if (metrics) {
      // Test coverage impact
      if (metrics.testCoverage && metrics.testCoverage < this.testCoverageThreshold) {
        riskScore *= (100 - metrics.testCoverage) / 20;
      }

      // Churn factor impact
      if (metrics.churnFactor && metrics.churnFactor > this.churnThreshold) {
        riskScore *= 1.5;
      }

      // Critical path impact
      if (metrics.isCriticalPath) {
        riskScore *= 2;
      }

      // Bug density impact
      if (metrics.bugDensity && metrics.bugDensity > this.bugDensityThreshold) {
        riskScore *= 1.5;
      }

      // Contributor count impact
      if (metrics.contributorCount && metrics.contributorCount > this.contributorThreshold) {
        riskScore *= 1.3;
      }

      // Review friction impact
      if (metrics.reviewFriction && metrics.reviewFriction > this.reviewFrictionThreshold) {
        riskScore *= 1.4;
      }

      // Test performance impact
      if (metrics.testPerformance && metrics.testPerformance > this.testPerformanceThreshold) {
        riskScore *= 1.2;
      }

      // Test stability impact
      if (metrics.testStability && metrics.testStability < this.testStabilityThreshold) {
        riskScore *= 1.3;
      }

      // Dependency drift impact
      if (metrics.dependencyDrift && metrics.dependencyDrift > this.dependencyDriftThreshold) {
        riskScore *= 1.4;
      }
    }

    return Math.round(riskScore);
  }

  private formatRiskLevel(score: number): string {
    if (score > 15) return '🔴 Critical';
    if (score > 10) return '🟠 High';
    if (score > 5) return '🟡 Medium';
    return '🟢 Low';
  }

  private createProgressBar(value: number, max: number, width: number = 10): string {
    const filled = Math.round((value / max) * width);
    return '█'.repeat(filled) + '░'.repeat(width - filled);
  }

  private async sendMessage(message: string, blocks?: any[]) {
    try {
      await this.web.chat.postMessage({
        channel: this.channelId,
        text: message,
        blocks: blocks || [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message
            }
          }
        ]
      });
    } catch (error) {
      console.error('Failed to send Slack message:', error);
    }
  }

  public async checkAndAlert() {
    const fixes = this.loadFixLog();
    const recentFixes = fixes.filter(fix => 
      differenceInHours(new Date(), new Date(fix.timestamp)) < 24
    );

    if (recentFixes.length > 0) {
      const fixedCount = recentFixes.filter(f => f.status === 'fixed').length;
      const manualCount = recentFixes.filter(f => f.status === 'manual').length;
      const highRiskFiles = new Set<string>();
      const lowCoverageFiles = new Set<string>();
      const criticalPathFiles = new Set<string>();
      const highChurnFiles = new Set<string>();
      const testBottleneckFiles = new Set<string>();
      const securityFiles = new Set<string>();
      const dependencyDriftFiles = new Set<string>();

      // Analyze files
      for (const fix of fixes) {
        const score = this.calculateRiskScore(fix.file, fixes);
        if (score > this.riskThreshold) {
          highRiskFiles.add(fix.file);
        }
        if (fix.testCoverage && fix.testCoverage < this.testCoverageThreshold) {
          lowCoverageFiles.add(fix.file);
        }
        if (fix.isCriticalPath) {
          criticalPathFiles.add(fix.file);
        }
        if (fix.churnFactor && fix.churnFactor > this.churnThreshold) {
          highChurnFiles.add(fix.file);
        }
        if (fix.testPerformance && fix.testPerformance > this.testPerformanceThreshold) {
          testBottleneckFiles.add(fix.file);
        }
        if (fix.category === 'security') {
          securityFiles.add(fix.file);
        }
        if (fix.dependencyDrift && fix.dependencyDrift > this.dependencyDriftThreshold) {
          dependencyDriftFiles.add(fix.file);
        }
      }

      // Send summary message
      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🧼 Code Fixer Report (Last 24h)',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Fixed Issues:*\n${fixedCount}`
            },
            {
              type: 'mrkdwn',
              text: `*Manual Fixes:*\n${manualCount}`
            }
          ]
        }
      ];

      // High Risk + High Churn Files
      if (highRiskFiles.size > 0 && highChurnFiles.size > 0) {
        const intersection = new Set([...highRiskFiles].filter(x => highChurnFiles.has(x)));
        if (intersection.size > 0) {
          blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '🔥 *High Risk + High Churn Files (Technical Debt):*'
            }
          });

          intersection.forEach(file => {
            const score = this.calculateRiskScore(file, fixes);
            const fix = fixes.find(f => f.file === file);
            blocks.push({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `• ${file}\n  Risk: ${this.formatRiskLevel(score)} | Churn: ${fix?.churnFactor || 0} commits\n  ${this.createProgressBar(score, 20)}`
              }
            });
          });
        }
      }

      // Test Bottlenecks
      if (testBottleneckFiles.size > 0) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🧪 *Test Bottlenecks:*'
          }
        });

        testBottleneckFiles.forEach(file => {
          const fix = fixes.find(f => f.file === file);
          blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `• ${file}\n  Performance: ${fix?.testPerformance || 0}ms | Stability: ${((fix?.testStability || 0) * 100).toFixed(1)}%\n  ${this.createProgressBar(fix?.testStability || 0, 1)}`
            }
          });
        });
      }

      // Security Files
      if (securityFiles.size > 0) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🔐 *Security Files Changed:*'
          }
        });

        securityFiles.forEach(file => {
          const fix = fixes.find(f => f.file === file);
          blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `• ${file}\n  Issue: ${fix?.issue || 'Security change'}\n  Author: ${fix?.author || 'unknown'}`
            }
          });
        });
      }

      // Dependency Drift
      if (dependencyDriftFiles.size > 0) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '📦 *Dependency Drift Detected:*'
          }
        });

        dependencyDriftFiles.forEach(file => {
          const fix = fixes.find(f => f.file === file);
          blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `• ${file}\n  Drift: ${((fix?.dependencyDrift || 0) * 100).toFixed(1)}%\n  ${this.createProgressBar(fix?.dependencyDrift || 0, 1)}`
            }
          });
        });
      }

      await this.sendMessage('Code Fixer Report', blocks);
    }
  }
}

// Main execution
const SLACK_TOKEN = process.env.SLACK_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;

if (!SLACK_TOKEN || !SLACK_CHANNEL) {
  console.error('Missing Slack configuration. Please set SLACK_TOKEN and SLACK_CHANNEL environment variables.');
  process.exit(1);
}

const alerts = new SlackAlerts(SLACK_TOKEN, SLACK_CHANNEL);
alerts.checkAndAlert(); 