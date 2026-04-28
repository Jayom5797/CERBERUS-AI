import { Router } from 'express';
import { getReport, downloadReport } from '../controllers/reportController';

export const reportRouter = Router();

// GET /api/reports/:scanId — get full audit report
reportRouter.get('/:scanId', getReport);

// GET /api/reports/:scanId/download — download as JSON
reportRouter.get('/:scanId/download', downloadReport);
