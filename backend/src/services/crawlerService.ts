import axios from 'axios';
import { DiscoveredEndpoint, ScanOptions, CrawlResult } from '@cerberus/shared';

export class CrawlerService {
  private scanId: string;
  private targetUrl: string;
  private options: ScanOptions;
  private crawlerUrl: string;

  constructor(scanId: string, targetUrl: string, options: ScanOptions) {
    this.scanId = scanId;
    this.targetUrl = targetUrl;
    this.options = options;
    this.crawlerUrl = process.env.CRAWLER_SERVICE_URL || 'http://localhost:4001';
  }

  async crawl(): Promise<CrawlResult> {
    try {
      const response = await axios.post<{ data: CrawlResult; success: boolean }>(
        `${this.crawlerUrl}/crawl`,
        { scanId: this.scanId, targetUrl: this.targetUrl, options: this.options },
        { timeout: 60_000, validateStatus: () => true }
      );

      // Fall back if: network error, non-200, success=false, or 0 endpoints
      if (
        response.status === 200 &&
        response.data?.success &&
        response.data?.data?.endpoints?.length > 0
      ) {
        return response.data.data;
      }

      console.warn('[CrawlerService] Playwright crawler unavailable or returned 0 endpoints — using HTTP crawler');
    } catch {
      console.warn('[CrawlerService] Playwright crawler network error — using HTTP crawler');
    }
    return this.smartCrawl();
  }

  /**
   * Smart HTTP crawler:
   * 1. Fetches root URL and parses any endpoint hints from the response
   * 2. Probes a comprehensive list of common API paths
   * 3. Discovers ID-based routes by probing /path/1, /path/2
   * 4. Follows any links found in JSON responses
   */
  private async smartCrawl(): Promise<CrawlResult> {
    const start = Date.now();
    const endpoints: DiscoveredEndpoint[] = [];
    const baseUrl = new URL(this.targetUrl).origin;
    const visited = new Set<string>();

    // Step 1: Fetch root and extract hints
    const rootPaths = await this.fetchAndExtractPaths(this.targetUrl, baseUrl);

    // Step 2: Comprehensive path list
    const commonPaths = [
      // Root
      '/', '/api', '/api/v1', '/api/v2', '/api/v3',
      // Auth
      '/api/auth', '/api/auth/login', '/api/login', '/api/signin',
      '/api/register', '/api/signup', '/api/token', '/api/refresh',
      '/api/logout', '/api/auth/me', '/api/me',
      // Users
      '/api/users', '/api/users/1', '/api/users/2', '/api/users/3',
      '/api/user', '/api/user/1', '/api/user/2',
      '/api/profile', '/api/profile/1', '/api/profile/2',
      '/api/account', '/api/accounts', '/api/accounts/1',
      '/api/members', '/api/members/1',
      // Decisions / AI
      '/api/loan', '/api/loan/apply', '/api/loan/status/1', '/api/loan/status/2',
      '/api/apply', '/api/decision', '/api/decisions',
      '/api/approve', '/api/score', '/api/predict',
      '/api/hire', '/api/screen', '/api/assess',
      '/api/credit', '/api/credit/score',
      // Orders / Products
      '/api/orders', '/api/orders/1', '/api/orders/2',
      '/api/products', '/api/products/1',
      '/api/items', '/api/items/1',
      '/api/cart', '/api/checkout',
      // Admin
      '/api/admin', '/api/admin/users', '/api/admin/dashboard',
      '/api/manage', '/api/internal',
      // Data
      '/api/data', '/api/data/1', '/api/records', '/api/records/1',
      '/api/search', '/api/query', '/api/filter',
      // Files
      '/api/files', '/api/upload', '/api/download',
      // Health
      '/api/health', '/health', '/status', '/ping',
      '/api/status', '/api/ping',
    ];

    // Merge with paths discovered from root response
    const allPaths = [...new Set([...commonPaths, ...rootPaths])];

    // Step 3: Probe all paths
    const probePromises = allPaths.map(async (path) => {
      const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
      if (visited.has(url)) return;
      visited.add(url);

      try {
        const res = await axios.get(url, {
          timeout: this.options.timeout || 5000,
          validateStatus: () => true,
          headers: { 'User-Agent': 'CERBERUS-AI Security Auditor/1.0', ...this.options.authHeaders },
          maxRedirects: 2,
        });

        if (res.status === 404 || res.status === 405) return;

        const ep: DiscoveredEndpoint = {
          url,
          method: 'GET',
          headers: res.config.headers as Record<string, string>,
          queryParams: {},
          statusCode: res.status,
          responseSchema: this.inferSchema(res.data),
        };
        endpoints.push(ep);

        // Step 4: If JSON response contains endpoint hints, follow them
        if (res.data && typeof res.data === 'object') {
          const nestedPaths = this.extractPathsFromJson(res.data, baseUrl);
          for (const nestedUrl of nestedPaths.slice(0, 10)) {
            if (!visited.has(nestedUrl)) {
              visited.add(nestedUrl);
              try {
                const nestedRes = await axios.get(nestedUrl, {
                  timeout: this.options.timeout || 5000,
                  validateStatus: () => true,
                  headers: { 'User-Agent': 'CERBERUS-AI Security Auditor/1.0', ...this.options.authHeaders },
                });
                if (nestedRes.status !== 404) {
                  endpoints.push({
                    url: nestedUrl,
                    method: 'GET',
                    headers: {},
                    queryParams: {},
                    statusCode: nestedRes.status,
                    responseSchema: this.inferSchema(nestedRes.data),
                  });
                }
              } catch { /* skip */ }
            }
          }
        }
      } catch { /* skip */ }
    });

    await Promise.allSettled(probePromises);

    // Step 5: For each discovered GET endpoint, also probe POST
    const postProbes = endpoints
      .filter((e) => e.statusCode === 200 && /apply|login|register|create|submit|score|predict|hire/i.test(e.url))
      .map(async (e) => {
        try {
          const res = await axios.post(e.url, {}, {
            timeout: this.options.timeout || 5000,
            validateStatus: () => true,
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'CERBERUS-AI Security Auditor/1.0', ...this.options.authHeaders },
          });
          if (res.status !== 404 && res.status !== 405) {
            endpoints.push({
              url: e.url,
              method: 'POST',
              headers: {},
              queryParams: {},
              statusCode: res.status,
              responseSchema: this.inferSchema(res.data),
            });
          }
        } catch { /* skip */ }
      });

    await Promise.allSettled(postProbes);

    // Deduplicate by url+method
    const seen = new Set<string>();
    const unique = endpoints.filter((e) => {
      const key = `${e.method}:${e.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      scanId: this.scanId,
      targetUrl: this.targetUrl,
      endpoints: unique,
      pageCount: visited.size,
      duration: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Fetch a URL and extract any API path hints from the response body.
   * Many APIs return their endpoint list at the root.
   */
  private async fetchAndExtractPaths(url: string, baseUrl: string): Promise<string[]> {
    try {
      const res = await axios.get(url, {
        timeout: 8000,
        validateStatus: () => true,
        headers: { 'User-Agent': 'CERBERUS-AI Security Auditor/1.0', ...this.options.authHeaders },
      });
      if (res.data) return this.extractPathsFromJson(res.data, baseUrl);
    } catch { /* skip */ }
    return [];
  }

  /**
   * Recursively scan a JSON object for strings that look like API paths.
   */
  private extractPathsFromJson(data: unknown, baseUrl: string): string[] {
    const paths: string[] = [];
    const seen = new Set<string>();

    const scan = (obj: unknown, depth = 0): void => {
      if (depth > 4 || !obj) return;
      if (typeof obj === 'string') {
        let path = obj;

        // Replace :param and {param} style templates with concrete values
        path = path.replace(/:([a-zA-Z_]+)/g, '1').replace(/\{[a-zA-Z_]+\}/g, '1');

        if (/^\/[a-zA-Z]/.test(path)) {
          const full = `${baseUrl}${path}`;
          if (!seen.has(full)) { seen.add(full); paths.push(full); }
        }
        if (obj.startsWith(baseUrl) && obj !== baseUrl) {
          if (!seen.has(obj)) { seen.add(obj); paths.push(obj); }
        }
        return;
      }
      if (Array.isArray(obj)) { obj.forEach((item) => scan(item, depth + 1)); return; }
      if (typeof obj === 'object') {
        Object.values(obj as Record<string, unknown>).forEach((v) => scan(v, depth + 1));
      }
    };

    scan(data);
    return paths;
  }

  private inferSchema(data: unknown): Record<string, unknown> {
    if (!data || typeof data !== 'object') return {};
    if (Array.isArray(data)) {
      return { type: 'array', itemKeys: data.length > 0 ? Object.keys(data[0] as object) : [] };
    }
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([k, v]) => [k, typeof v])
    );
  }
}
