import { ScanOptions, ScanEvent, AuditReport, ReportSummary } from '@cerberus/shared';
import { scanStore } from './scanStore';
import { reportStore } from './reportStore';
import { sseManager } from './sseManager';
import { CrawlerService } from './crawlerService';
import { VulnerabilityEngine } from './vulnerabilityEngine';
import { BiasEngine } from './biasEngine';
import { GeminiService } from './geminiService';

export class ScanOrchestrator {
  private scanId: string;
  private targetUrl: string;
  private options: ScanOptions;

  constructor(scanId: string, targetUrl: string, options: ScanOptions) {
    this.scanId = scanId;
    this.targetUrl = targetUrl;
    this.options = options;
  }

  async run(): Promise<void> {
    const startTime = Date.now();

    try {
      // ── Phase 1: Crawl ──────────────────────────────────────────────────────
      await this.setStatus('crawling', 5);
      this.emit('scan:started', { targetUrl: this.targetUrl });

      const crawler = new CrawlerService(this.scanId, this.targetUrl, this.options);
      const crawlResult = await crawler.crawl();

      this.emit('scan:progress', {
        phase: 'crawling',
        message: `Discovered ${crawlResult.endpoints.length} endpoints`,
        endpoints: crawlResult.endpoints,
      });
      await this.setStatus('analyzing', 25);

      // ── Phase 2: AI Classification ──────────────────────────────────────────
      const gemini = new GeminiService();
      const classifiedEndpoints = await gemini.classifyEndpoints(crawlResult.endpoints);

      await this.setStatus('testing', 40);

      // ── Phase 3: Vulnerability Testing ─────────────────────────────────────
      const vulnFindings = [];
      if (this.options.enableVulnTesting !== false) {
        const vulnEngine = new VulnerabilityEngine(this.scanId, this.options);
        const findings = await vulnEngine.test(classifiedEndpoints);

        for (const finding of findings) {
          vulnFindings.push(finding);
          this.emit('vuln:found', finding);
        }
      }

      await this.setStatus('bias_check', 70);

      // ── Phase 4: Bias Detection ─────────────────────────────────────────────
      const biasFindings = [];
      if (this.options.enableBiasDetection !== false) {
        const biasEngine = new BiasEngine(this.scanId, this.options);
        const findings = await biasEngine.analyze(classifiedEndpoints);

        for (const finding of findings) {
          biasFindings.push(finding);
          this.emit('bias:found', finding);
        }
      }

      await this.setStatus('reporting', 90);

      // ── Phase 5: Generate Report ────────────────────────────────────────────
      const aiOverview = await gemini.generateAuditOverview({
        targetUrl: this.targetUrl,
        endpoints: classifiedEndpoints,
        vulnerabilities: vulnFindings,
        biasFindings,
      });

      const summary = this.buildSummary(classifiedEndpoints, vulnFindings, biasFindings);
      const riskScore = this.calculateRiskScore(vulnFindings, biasFindings);

      const report: AuditReport = {
        scanId: this.scanId,
        targetUrl: this.targetUrl,
        generatedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
        summary,
        endpoints: classifiedEndpoints,
        vulnerabilities: vulnFindings,
        biasFindings,
        riskScore,
        aiOverview,
      };

      await reportStore.save(report);
      await this.setStatus('completed', 100);
      this.emit('scan:completed', { report });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await scanStore.updateStatus(this.scanId, 'failed', message);
      this.emit('scan:failed', { error: message });
      throw err;
    }
  }

  private async setStatus(status: Parameters<typeof scanStore.updateStatus>[1], progress: number): Promise<void> {
    await scanStore.update(this.scanId, { status, progress });
    this.emit('scan:status_change', { status, progress });
  }

  private emit(type: ScanEvent['type'], data: unknown): void {
    sseManager.emit(this.scanId, {
      type,
      scanId: this.scanId,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  private buildSummary(
    endpoints: ReturnType<typeof Array.prototype.slice>,
    vulns: ReturnType<typeof Array.prototype.slice>,
    bias: ReturnType<typeof Array.prototype.slice>
  ): ReportSummary {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const v of vulns) {
      if (v.severity in counts) counts[v.severity as keyof typeof counts]++;
    }

    const riskLevel = counts.critical > 0 ? 'critical'
      : counts.high > 0 ? 'high'
      : counts.medium > 0 ? 'medium'
      : counts.low > 0 ? 'low'
      : 'safe';

    return {
      totalEndpoints: endpoints.length,
      testedEndpoints: endpoints.length,
      totalVulnerabilities: vulns.length,
      criticalCount: counts.critical,
      highCount: counts.high,
      mediumCount: counts.medium,
      lowCount: counts.low,
      biasIssues: bias.length,
      riskLevel,
    };
  }

  private calculateRiskScore(vulns: unknown[], bias: unknown[]): number {
    let score = 0;
    for (const v of vulns as Array<{ severity: string }>) {
      score += v.severity === 'critical' ? 25
        : v.severity === 'high' ? 15
        : v.severity === 'medium' ? 8
        : 3;
    }
    score += (bias as unknown[]).length * 10;
    return Math.min(100, score);
  }
}
