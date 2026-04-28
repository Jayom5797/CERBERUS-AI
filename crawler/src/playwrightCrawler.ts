import { chromium, Browser, BrowserContext, Page, Request as PWRequest } from 'playwright';
import { DiscoveredEndpoint, CrawlResult, ScanOptions } from '@cerberus/shared';

interface InterceptedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  resourceType: string;
}

interface InterceptedResponse {
  url: string;
  status: number;
  headers: Record<string, string>;
  body?: string;
}

export class PlaywrightCrawler {
  private scanId: string;
  private targetUrl: string;
  private options: ScanOptions;
  private visitedUrls = new Set<string>();
  private interceptedRequests = new Map<string, InterceptedRequest>();
  private interceptedResponses = new Map<string, InterceptedResponse>();
  private browser: Browser | null = null;

  constructor(scanId: string, targetUrl: string, options: ScanOptions) {
    this.scanId = scanId;
    this.targetUrl = targetUrl;
    this.options = options;
  }

  async crawl(): Promise<CrawlResult> {
    const start = Date.now();

    try {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const context = await this.browser.newContext({
        userAgent: 'CERBERUS-AI Security Auditor/1.0',
        extraHTTPHeaders: this.options.authHeaders || {},
        ignoreHTTPSErrors: true,
      });

      // Intercept all network requests
      await context.route('**/*', async (route) => {
        const request = route.request();
        this.captureRequest(request);
        await route.continue();
      });

      context.on('response', async (response) => {
        try {
          const url = response.url();
          const headers = await response.allHeaders();
          let body: string | undefined;

          const contentType = headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            body = await response.text().catch(() => undefined);
          }

          this.interceptedResponses.set(url, {
            url,
            status: response.status(),
            headers,
            body,
          });
        } catch {
          // Response capture failed — skip
        }
      });

      // Crawl the target URL and linked pages
      await this.crawlPage(context, this.targetUrl, 0);

      // Build endpoint list from intercepted API calls
      const endpoints = this.buildEndpoints();

      return {
        scanId: this.scanId,
        targetUrl: this.targetUrl,
        endpoints,
        pageCount: this.visitedUrls.size,
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
      };

    } finally {
      await this.browser?.close();
    }
  }

  private async crawlPage(context: BrowserContext, url: string, depth: number): Promise<void> {
    const maxDepth = this.options.maxDepth ?? 3;
    if (depth > maxDepth || this.visitedUrls.has(url)) return;

    this.visitedUrls.add(url);
    console.log(`[Crawler] Visiting (depth ${depth}): ${url}`);

    const page = await context.newPage();

    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.options.timeout || 30000,
      });

      // Interact with the page to trigger API calls
      await this.interactWithPage(page);

      // Collect links for further crawling
      if (depth < maxDepth) {
        const links = await this.extractLinks(page, url);
        await page.close();

        for (const link of links.slice(0, 10)) { // Limit links per page
          await this.crawlPage(context, link, depth + 1);
        }
      } else {
        await page.close();
      }

    } catch (err) {
      console.warn(`[Crawler] Failed to crawl ${url}:`, err instanceof Error ? err.message : err);
      await page.close().catch(() => {});
    }
  }

  private async interactWithPage(page: Page): Promise<void> {
    try {
      // Click buttons and links to trigger API calls
      const clickables = await page.$$('button, [role="button"], a[href="#"], input[type="submit"]');
      for (const el of clickables.slice(0, 5)) {
        await el.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(500);
      }

      // Fill and submit forms
      const forms = await page.$$('form');
      for (const form of forms.slice(0, 3)) {
        await this.fillForm(page, form);
      }

      // Scroll to trigger lazy-loaded content
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);

    } catch {
      // Interaction errors are non-fatal
    }
  }

  private async fillForm(page: Page, form: Awaited<ReturnType<Page['$']>>): Promise<void> {
    if (!form) return;
    try {
      const inputs = await form!.$$('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
      for (const input of inputs) {
        const type = await input.getAttribute('type');
        const name = await input.getAttribute('name') || '';

        if (type === 'email') await input.fill('test@cerberus-audit.com').catch(() => {});
        else if (type === 'password') await input.fill('TestPassword123!').catch(() => {});
        else if (type === 'number') await input.fill('42').catch(() => {});
        else if (type === 'checkbox') await input.check().catch(() => {});
        else if (/name|first|last/i.test(name)) await input.fill('Test User').catch(() => {});
        else await input.fill('test_value').catch(() => {});
      }

      // Submit the form
      const submitBtn = await form!.$('[type="submit"]');
      if (submitBtn) {
        await submitBtn.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(1000);
      }
    } catch {
      // Form interaction failed — skip
    }
  }

  private async extractLinks(page: Page, baseUrl: string): Promise<string[]> {
    try {
      const base = new URL(baseUrl);
      const hrefs = await page.$$eval('a[href]', (els) =>
        els.map((el) => (el as HTMLAnchorElement).href)
      );

      return hrefs
        .filter((href) => {
          try {
            const url = new URL(href);
            return url.origin === base.origin && !href.includes('#');
          } catch {
            return false;
          }
        })
        .slice(0, 20);
    } catch {
      return [];
    }
  }

  private captureRequest(request: PWRequest): void {
    const url = request.url();
    const resourceType = request.resourceType();

    // Capture XHR, fetch, and document requests
    if (!['xhr', 'fetch', 'document'].includes(resourceType)) return;
    if (/\.(css|js|png|jpg|gif|ico|woff|woff2|svg|map)(\?|$)/.test(url)) return;
    // Skip analytics, tracking, CDN
    if (/google-analytics|googletagmanager|hotjar|segment|mixpanel|cdn\./i.test(url)) return;

    this.interceptedRequests.set(`${request.method()}:${url}`, {
      url,
      method: request.method(),
      headers: request.headers(),
      postData: request.postData() || undefined,
      resourceType,
    });
  }

  private buildEndpoints(): DiscoveredEndpoint[] {
    const endpoints: DiscoveredEndpoint[] = [];
    const seen = new Set<string>();

    for (const [key, req] of this.interceptedRequests) {
      const dedupeKey = `${req.method}:${req.url}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const response = this.interceptedResponses.get(req.url);
      let bodySchema: Record<string, unknown> | undefined;
      let responseSchema: Record<string, unknown> | undefined;

      if (req.postData) {
        try {
          const parsed = JSON.parse(req.postData);
          bodySchema = this.inferSchema(parsed);
        } catch {
          // Try form-encoded
          try {
            const params = new URLSearchParams(req.postData);
            bodySchema = Object.fromEntries([...params.entries()].map(([k]) => [k, 'string']));
          } catch {
            bodySchema = { raw: typeof req.postData };
          }
        }
      }

      if (response?.body) {
        try {
          const parsed = JSON.parse(response.body);
          responseSchema = this.inferSchema(parsed);
        } catch {
          responseSchema = {};
        }
      }

      const queryParams: Record<string, string> = {};
      try {
        new URL(req.url).searchParams.forEach((v, k) => { queryParams[k] = v; });
      } catch { /* skip */ }

      endpoints.push({
        url: req.url,
        method: req.method,
        headers: req.headers,
        queryParams,
        bodySchema,
        responseSchema,
        statusCode: response?.status,
      });
    }

    return endpoints;
  }

  private inferSchema(data: unknown): Record<string, unknown> {
    if (!data || typeof data !== 'object') return { type: typeof data };
    if (Array.isArray(data)) {
      return {
        type: 'array',
        length: data.length,
        itemSchema: data.length > 0 ? this.inferSchema(data[0]) : {},
      };
    }
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([k, v]) => [
        k,
        Array.isArray(v) ? 'array' : typeof v,
      ])
    );
  }
}
