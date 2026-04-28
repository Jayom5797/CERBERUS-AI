import 'dotenv/config';
import express from 'express';
import { crawlHandler } from './crawlHandler';

const app = express();
const PORT = process.env.CRAWLER_PORT || 4001;

app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cerberus-crawler' });
});

app.post('/crawl', crawlHandler);

app.listen(PORT, () => {
  console.log(`🕷️  CERBERUS crawler service running on http://localhost:${PORT}`);
});
