// Test Reporter for ProcessAudit AI E2E Testing
// Provides comprehensive error tracking, documentation, and reporting

import { Page, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export interface TestIssueContext {
  step: string;
  expected: string;
  actual: string;
  screenshot?: string;
  htmlSnapshot?: string;
  networkLogs?: any[];
  error?: Error;
  timestamp: Date;
  url?: string;
  testInfo?: TestInfo;
}

export class TestReporter {
  private issuesLog: TestIssueContext[] = [];
  private testStartTime: Date;
  private currentStep: string = '';

  constructor(private testInfo: TestInfo) {
    this.testStartTime = new Date();
    this.setupReportDirectory();
  }

  private setupReportDirectory() {
    const reportDir = path.join(process.cwd(), 'test-results', 'issues');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
  }

  setCurrentStep(step: string) {
    this.currentStep = step;
    console.log(`🔄 Test Step: ${step}`);
  }

  async documentIssue(page: Page, context: Omit<TestIssueContext, 'timestamp' | 'url' | 'screenshot' | 'htmlSnapshot'>) {
    try {
      const timestamp = new Date();
      const url = page.url();
      
      // Capture screenshot
      const screenshotPath = path.join(
        'test-results', 'issues', 
        `${this.testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp.getTime()}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Capture HTML snapshot  
      const htmlContent = await page.content();
      const htmlPath = path.join(
        'test-results', 'issues',
        `${this.testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp.getTime()}.html`
      );
      fs.writeFileSync(htmlPath, htmlContent);

      // Capture network logs (if available)
      const networkLogs = await this.captureNetworkLogs(page);

      const issue: TestIssueContext = {
        ...context,
        timestamp,
        url,
        screenshot: screenshotPath,
        htmlSnapshot: htmlPath,
        networkLogs,
        testInfo: this.testInfo
      };

      this.issuesLog.push(issue);
      
      console.error(`❌ Issue documented: ${context.step} - ${context.expected} vs ${context.actual}`);
      
    } catch (error) {
      console.error('Failed to document issue:', error);
    }
  }

  async documentSuccess(page: Page, step: string, details: string) {
    console.log(`✅ Success: ${step} - ${details}`);
    
    // Optional: capture success screenshots for important steps
    if (step.includes('PDF') || step.includes('download')) {
      const screenshotPath = path.join(
        'test-results', 'success',
        `${this.testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}_${step.replace(/[^a-zA-Z0-9]/g, '_')}.png`
      );
      await page.screenshot({ path: screenshotPath });
    }
  }

  private async captureNetworkLogs(page: Page): Promise<any[]> {
    // Note: This would require setting up network request monitoring
    // For now, return empty array - can be enhanced later
    return [];
  }

  async generateFinalReport(): Promise<string> {
    const reportData = {
      testInfo: {
        title: this.testInfo.title,
        duration: Date.now() - this.testStartTime.getTime(),
        startTime: this.testStartTime,
        endTime: new Date()
      },
      summary: {
        totalIssues: this.issuesLog.length,
        issuesByStep: this.groupIssuesByStep(),
        criticalIssues: this.issuesLog.filter(i => i.step.includes('critical') || i.step.includes('PDF'))
      },
      issues: this.issuesLog,
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(
      'test-results', 
      `${this.testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}_report.json`
    );
    
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(reportData);
    const markdownPath = path.join(
      'test-results',
      `${this.testInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}_report.md`
    );
    fs.writeFileSync(markdownPath, markdownReport);

    return markdownPath;
  }

  private groupIssuesByStep(): Record<string, number> {
    const grouped: Record<string, number> = {};
    this.issuesLog.forEach(issue => {
      grouped[issue.step] = (grouped[issue.step] || 0) + 1;
    });
    return grouped;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.issuesLog.some(i => i.step.includes('login'))) {
      recommendations.push('Review authentication flow for reliability issues');
    }
    
    if (this.issuesLog.some(i => i.step.includes('PDF'))) {
      recommendations.push('Investigate PDF generation system for stability');
    }
    
    if (this.issuesLog.some(i => i.step.includes('upload'))) {
      recommendations.push('Validate file upload handling and error messages');
    }
    
    if (this.issuesLog.length === 0) {
      recommendations.push('Test passed successfully - consider expanding test coverage');
    }

    return recommendations;
  }

  private generateMarkdownReport(reportData: any): string {
    return `# ProcessAudit AI E2E Test Report

## Test Summary
- **Test**: ${reportData.testInfo.title}
- **Duration**: ${reportData.testInfo.duration}ms
- **Start Time**: ${reportData.testInfo.startTime}
- **End Time**: ${reportData.testInfo.endTime}
- **Total Issues**: ${reportData.summary.totalIssues}

## Issues Encountered
${reportData.issues.map((issue: TestIssueContext, index: number) => `
### Issue ${index + 1}: ${issue.step}
- **Expected**: ${issue.expected}
- **Actual**: ${issue.actual}
- **URL**: ${issue.url}
- **Screenshot**: ${issue.screenshot}
- **HTML Snapshot**: ${issue.htmlSnapshot}
- **Error**: ${issue.error?.message || 'N/A'}
`).join('\n')}

## Recommendations
${reportData.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

## Test Execution Details
- Issues by Step: ${JSON.stringify(reportData.summary.issuesByStep, null, 2)}
- Critical Issues: ${reportData.summary.criticalIssues.length}

Generated on: ${new Date().toISOString()}
`;
  }

  getIssueCount(): number {
    return this.issuesLog.length;
  }

  hasCriticalIssues(): boolean {
    return this.issuesLog.some(i => 
      i.step.includes('PDF') || 
      i.step.includes('critical') || 
      i.step.includes('authentication')
    );
  }
}

export default TestReporter;