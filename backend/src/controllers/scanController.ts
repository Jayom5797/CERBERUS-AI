import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ScanJob, ScanRequest, DEFAULT_SCAN_OPTIONS } from '@cerberus/shared';
import { scanStore } from '../services/scanStore';
import { ScanOrchestrator } from '../services/scanOrchestrator';
import { sseManager } from '../services/sseManager';
import { createError } from '../middleware/errorHandler';

export async function startScan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { targetUrl, options } = req.body as ScanRequest;

    const scanId = uuidv4();
    const now = new Date().toISOString();

    const job: ScanJob = {
      id: scanId,
      targetUrl,
      status: 'queued',
      progress: 0,
      createdAt: now,
      updatedAt: now,
      options: { ...DEFAULT_SCAN_OPTIONS, ...options },
    };

    await scanStore.save(job);

    // Start scan asynchronously — don't await
    const orchestrator = new ScanOrchestrator(scanId, targetUrl, job.options);
    orchestrator.run().catch((err) => {
      console.error(`[Scan ${scanId}] Fatal error:`, err);
      scanStore.updateStatus(scanId, 'failed', err.message);
    });

    res.status(202).json({
      success: true,
      data: { scanId, status: 'queued' },
    });
  } catch (err) {
    next(err);
  }
}

export async function getScanStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const job = await scanStore.get(id);
    if (!job) {
      return next(createError('Scan not found', 404, 'SCAN_NOT_FOUND'));
    }
    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
}

export async function listScans(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scans = await scanStore.list();
    res.json({ success: true, data: scans });
  } catch (err) {
    next(err);
  }
}

export function streamScanEvents(req: Request, res: Response): void {
  const { id } = req.params;

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', scanId: id })}\n\n`);

  // Register client
  const clientId = sseManager.addClient(id, res);

  // Send current state immediately
  scanStore.get(id).then((job) => {
    if (job) {
      res.write(`data: ${JSON.stringify({ type: 'scan:status_change', scanId: id, data: job })}\n\n`);
    }
  });

  req.on('close', () => {
    sseManager.removeClient(id, clientId);
  });
}
