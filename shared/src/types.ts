// ─── Scan ────────────────────────────────────────────────────────────────────

export type ScanStatus =
  | 'queued'
  | 'crawling'
  | 'analyzing'
  | 'testing'
  | 'bias_check'
  | 'reporting'
  | 'completed'
  | 'failed';

export interface ScanRequest {
  targetUrl: string;
  options?: ScanOptions;
}

export interface ScanOptions {
  maxDepth?: number;           // crawler depth limit (default 3)
  maxEndpoints?: number;       // max endpoints to test (default 50)
  enableBiasDetection?: boolean;
  enableVulnTesting?: boolean;
  authHeaders?: Record<string, string>;
  timeout?: number;            // ms per request
}

export interface ScanJob {
  id: string;
  targetUrl: string;
  status: ScanStatus;
  progress: number;            // 0-100
  createdAt: string;
  updatedAt: string;
  options: ScanOptions;
  error?: string;
}

// ─── Crawler ─────────────────────────────────────────────────────────────────

export interface DiscoveredEndpoint {
  url: string;
  method: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  bodySchema?: Record<string, unknown>;
  responseSchema?: Record<string, unknown>;
  statusCode?: number;
  category?: EndpointCategory;
  riskScore?: number;
}

export type EndpointCategory =
  | 'auth'
  | 'user_data'
  | 'payment'
  | 'admin'
  | 'search'
  | 'file'
  | 'decision'
  | 'unknown';

export interface CrawlResult {
  scanId: string;
  targetUrl: string;
  endpoints: DiscoveredEndpoint[];
  pageCount: number;
  duration: number;
  timestamp: string;
}

// ─── Vulnerability ────────────────────────────────────────────────────────────

export type VulnType =
  | 'IDOR'
  | 'AUTH_BYPASS'
  | 'INPUT_VALIDATION'
  | 'TOKEN_MISUSE'
  | 'WORKFLOW_BYPASS'
  | 'REPLAY_ATTACK'
  | 'INVALID_STATE';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface VulnerabilityFinding {
  id: string;
  scanId: string;
  type: VulnType;
  severity: Severity;
  title: string;
  description: string;
  endpoint: string;
  method: string;
  proof: VulnProof;
  cvssScore?: number;
  remediation: string;
  aiExplanation?: string;
}

export interface VulnProof {
  originalRequest: HttpRequest;
  maliciousRequest: HttpRequest;
  originalResponse: HttpResponse;
  maliciousResponse: HttpResponse;
  difference: string;
}

export interface HttpRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  curlCommand: string;
}

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  duration: number;
}

// ─── Bias ─────────────────────────────────────────────────────────────────────

export interface BiasTestCase {
  id: string;
  attribute: string;          // e.g. "gender", "region", "age"
  personaA: BiasPersona;
  personaB: BiasPersona;
}

export interface BiasPersona {
  label: string;              // e.g. "Male", "Female"
  payload: Record<string, unknown>;
}

export interface BiasFinding {
  id: string;
  scanId: string;
  endpoint: string;
  attribute: string;
  severity: Severity;
  title: string;
  description: string;
  testCases: BiasTestResult[];
  disparityScore: number;     // 0-1, higher = more biased
  aiExplanation: string;
}

export interface BiasTestResult {
  testCaseId: string;
  personaA: BiasPersona;
  personaB: BiasPersona;
  responseA: HttpResponse;
  responseB: HttpResponse;
  disparity: boolean;
  disparityDetails: string;
}

// ─── Report ───────────────────────────────────────────────────────────────────

export interface AuditReport {
  scanId: string;
  targetUrl: string;
  generatedAt: string;
  duration: number;
  summary: ReportSummary;
  endpoints: DiscoveredEndpoint[];
  vulnerabilities: VulnerabilityFinding[];
  biasFindings: BiasFinding[];
  riskScore: number;          // 0-100
  aiOverview: string;
}

export interface ReportSummary {
  totalEndpoints: number;
  testedEndpoints: number;
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  biasIssues: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'safe';
}

// ─── SSE Events ───────────────────────────────────────────────────────────────

export interface ScanEvent {
  type: ScanEventType;
  scanId: string;
  timestamp: string;
  data: unknown;
}

export type ScanEventType =
  | 'scan:started'
  | 'scan:progress'
  | 'scan:status_change'
  | 'crawler:endpoint_found'
  | 'vuln:found'
  | 'bias:found'
  | 'scan:completed'
  | 'scan:failed';
