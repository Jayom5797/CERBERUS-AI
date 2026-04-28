import { Router } from 'express';
import { startScan, getScanStatus, streamScanEvents, listScans } from '../controllers/scanController';
import { validateScanRequest } from '../middleware/validateRequest';

export const scanRouter = Router();

// POST /api/scans — start a new scan
scanRouter.post('/', validateScanRequest, startScan);

// GET /api/scans — list all scans
scanRouter.get('/', listScans);

// GET /api/scans/:id — get scan status
scanRouter.get('/:id', getScanStatus);

// GET /api/scans/:id/events — SSE stream for real-time updates
scanRouter.get('/:id/events', streamScanEvents);
