import { Request, Response, NextFunction } from 'express';
import { reportStore } from '../services/reportStore';
import { createError } from '../middleware/errorHandler';

export async function getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { scanId } = req.params;
    const report = await reportStore.get(scanId);
    if (!report) {
      return next(createError('Report not found. Scan may still be in progress.', 404, 'REPORT_NOT_FOUND'));
    }
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

export async function downloadReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { scanId } = req.params;
    const report = await reportStore.get(scanId);
    if (!report) {
      return next(createError('Report not found', 404, 'REPORT_NOT_FOUND'));
    }

    const filename = `cerberus-audit-${scanId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(report);
  } catch (err) {
    next(err);
  }
}
