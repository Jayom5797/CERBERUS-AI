import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { scanRouter } from './routes/scan';
import { reportRouter } from './routes/report';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/scans', scanRouter);
app.use('/api/reports', reportRouter);

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🐕 CERBERUS-AI backend running on http://localhost:${PORT}`);
});

export default app;
