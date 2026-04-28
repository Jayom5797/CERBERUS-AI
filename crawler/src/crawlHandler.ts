import { Request, Response } from 'express';
import { PlaywrightCrawler } from './playwrightCrawler';

export async function crawlHandler(req: Request, res: Response): Promise<void> {
  const { scanId, targetUrl, options } = req.body;

  if (!scanId || !targetUrl) {
    res.status(400).json({ success: false, error: 'scanId and targetUrl are required' });
    return;
  }

  try {
    const crawler = new PlaywrightCrawler(scanId, targetUrl, options || {});
    const result = await crawler.crawl();
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[CrawlHandler] Error:', err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Crawl failed',
    });
  }
}
