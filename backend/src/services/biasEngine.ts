import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  DiscoveredEndpoint,
  BiasFinding,
  BiasTestResult,
  HttpResponse,
  ScanOptions,
  Severity,
} from '@cerberus/shared';
import { BIAS_ATTRIBUTES } from '@cerberus/shared';
import { GeminiService } from './geminiService';

export class BiasEngine {
  private scanId: string;
  private options: ScanOptions;
  private gemini: GeminiService;

  constructor(scanId: string, options: ScanOptions) {
    this.scanId = scanId;
    this.options = options;
    this.gemini = new GeminiService();
  }

  async analyze(endpoints: DiscoveredEndpoint[]): Promise<BiasFinding[]> {
    const findings: BiasFinding[] = [];

    // Focus on decision-making endpoints
    const decisionEndpoints = endpoints.filter(
      (e) =>
        e.category === 'decision' ||
        e.category === 'user_data' ||
        /loan|hire|approve|score|predict|decision|apply|assess|evaluate|screen/i.test(e.url)
    );

    for (const endpoint of decisionEndpoints) {
      if (endpoint.method !== 'POST' && endpoint.method !== 'GET') continue;

      // Probe the endpoint first to discover its actual field names
      const enrichedEndpoint = await this.probeEndpointSchema(endpoint);

      for (const attribute of BIAS_ATTRIBUTES.slice(0, 3)) {
        const finding = await this.testBiasForAttribute(enrichedEndpoint, attribute);
        if (finding) findings.push(finding);
      }
    }

    return findings;
  }

  /**
   * Send a probe request to discover what fields the endpoint actually accepts.
   * Uses the response to infer field names via Gemini.
   */
  private async probeEndpointSchema(endpoint: DiscoveredEndpoint): Promise<DiscoveredEndpoint> {
    if (endpoint.bodySchema && Object.keys(endpoint.bodySchema).length > 0) {
      return endpoint; // Already have schema from crawler
    }

    // Send a minimal probe to get a response we can analyze
    const probePayload = { income: 50000, credit_score: 700, age: 30, gender: 'male', loan_amount: 10000 };
    try {
      const res = await axios({
        url: endpoint.url,
        method: endpoint.method.toLowerCase(),
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'CERBERUS-AI/1.0', ...this.options.authHeaders },
        data: endpoint.method === 'POST' ? probePayload : undefined,
        params: endpoint.method === 'GET' ? probePayload : undefined,
        timeout: this.options.timeout || 8000,
        validateStatus: () => true,
      });

      // If we got a meaningful response, use Gemini to infer the actual field names
      if (res.status === 200 && res.data) {
        const inferredFields = await this.gemini.inferRequestFields(endpoint, res.data);
        if (Object.keys(inferredFields).length > 0) {
          return { ...endpoint, bodySchema: inferredFields, responseSchema: this.inferSchema(res.data) };
        }
        // Even without Gemini, capture the response schema
        return { ...endpoint, responseSchema: this.inferSchema(res.data) };
      }
    } catch {
      // Probe failed — use endpoint as-is
    }
    return endpoint;
  }

  private async testBiasForAttribute(
    endpoint: DiscoveredEndpoint,
    attribute: string
  ): Promise<BiasFinding | null> {
    const personas = await this.gemini.generateBiasPersonas(endpoint, attribute);
    if (personas.length < 2) return null;

    const [personaA, personaB] = personas;
    const testResults: BiasTestResult[] = [];
    const TRIALS = 3;
    let disparityCount = 0;

    for (let i = 0; i < TRIALS; i++) {
      try {
        const [responseA, responseB] = await Promise.all([
          this.sendRequest(endpoint, personaA.payload),
          this.sendRequest(endpoint, personaB.payload),
        ]);

        // Skip if both returned errors (endpoint doesn't accept our payload)
        if (responseA.statusCode === 0 && responseB.statusCode === 0) continue;
        if (responseA.statusCode >= 400 && responseB.statusCode >= 400) continue;

        const disparity = this.detectDisparity(responseA, responseB);

        testResults.push({
          testCaseId: uuidv4(),
          personaA: { label: personaA.label, payload: personaA.payload },
          personaB: { label: personaB.label, payload: personaB.payload },
          responseA,
          responseB,
          disparity: disparity.detected,
          disparityDetails: disparity.details,
        });

        if (disparity.detected) disparityCount++;
      } catch {
        continue;
      }
    }

    if (testResults.length === 0) return null;

    const disparityScore = disparityCount / testResults.length;
    if (disparityScore < 0.5) return null;

    const severity: Severity = disparityScore >= 0.8 ? 'high' : 'medium';

    const finding: Partial<BiasFinding> = {
      endpoint: endpoint.url,
      attribute,
      severity,
      title: `Bias Detected: ${attribute} Disparity at ${new URL(endpoint.url).pathname}`,
      description: `The endpoint produces different outcomes for identical profiles that differ only in "${attribute}". Disparity detected in ${disparityCount}/${testResults.length} trials (${Math.round(disparityScore * 100)}%).`,
      testCases: testResults,
      disparityScore,
    };

    const aiExplanation = await this.gemini.explainBias(finding);
    return { id: uuidv4(), scanId: this.scanId, ...finding, aiExplanation } as BiasFinding;
  }

  private async sendRequest(endpoint: DiscoveredEndpoint, payload: Record<string, unknown>): Promise<HttpResponse> {
    const start = Date.now();
    try {
      const res = await axios({
        url: endpoint.url,
        method: endpoint.method.toLowerCase(),
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'CERBERUS-AI/1.0', ...this.options.authHeaders },
        data: endpoint.method === 'POST' ? payload : undefined,
        params: endpoint.method === 'GET' ? payload : undefined,
        timeout: this.options.timeout || 10000,
        validateStatus: () => true,
      });
      return { statusCode: res.status, headers: res.headers as Record<string, string>, body: res.data, duration: Date.now() - start };
    } catch (err) {
      return { statusCode: 0, headers: {}, body: { error: err instanceof Error ? err.message : 'Request failed' }, duration: Date.now() - start };
    }
  }

  private detectDisparity(responseA: HttpResponse, responseB: HttpResponse): { detected: boolean; details: string } {
    // Status code disparity
    if (responseA.statusCode !== responseB.statusCode) {
      return { detected: true, details: `Different status codes: ${responseA.statusCode} vs ${responseB.statusCode}` };
    }

    const bodyA = responseA.body as Record<string, unknown>;
    const bodyB = responseB.body as Record<string, unknown>;

    // Check all boolean/string decision fields
    const decisionFields = ['approved', 'status', 'decision', 'result', 'eligible', 'accepted', 'rejected', 'qualified', 'passed', 'outcome'];
    for (const field of decisionFields) {
      if (field in bodyA && field in bodyB && bodyA[field] !== bodyB[field]) {
        return { detected: true, details: `Decision field "${field}" differs: ${JSON.stringify(bodyA[field])} vs ${JSON.stringify(bodyB[field])}` };
      }
    }

    // Check numeric score fields (>10% difference)
    const scoreFields = ['score', 'probability', 'confidence', 'rating', 'risk_score', 'credit_score', 'approval_score', 'rank'];
    for (const field of scoreFields) {
      if (field in bodyA && field in bodyB) {
        const numA = Number(bodyA[field]);
        const numB = Number(bodyB[field]);
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
          const diff = Math.abs(numA - numB) / Math.max(Math.abs(numA), Math.abs(numB), 1);
          if (diff > 0.1) {
            return { detected: true, details: `Score field "${field}" differs: ${numA} vs ${numB} (${Math.round(diff * 100)}% difference)` };
          }
        }
      }
    }

    // Deep scan: check any numeric field that differs significantly
    for (const key of Object.keys(bodyA)) {
      if (key in bodyB) {
        const numA = Number(bodyA[key]);
        const numB = Number(bodyB[key]);
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
          const diff = Math.abs(numA - numB) / Math.max(Math.abs(numA), Math.abs(numB), 1);
          if (diff > 0.2) { // 20% threshold for unknown fields
            return { detected: true, details: `Field "${key}" differs significantly: ${numA} vs ${numB}` };
          }
        }
      }
    }

    return { detected: false, details: 'No significant disparity detected' };
  }

  private inferSchema(data: unknown): Record<string, unknown> {
    if (!data || typeof data !== 'object') return {};
    if (Array.isArray(data)) return { type: 'array' };
    return Object.fromEntries(Object.entries(data as Record<string, unknown>).map(([k, v]) => [k, typeof v]));
  }
}
