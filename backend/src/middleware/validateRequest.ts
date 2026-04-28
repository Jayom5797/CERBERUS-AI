import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const ScanRequestSchema = z.object({
  targetUrl: z
    .string()
    .url('Must be a valid URL')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'URL must use http or https protocol'
    ),
  options: z
    .object({
      maxDepth: z.number().int().min(1).max(5).optional(),
      maxEndpoints: z.number().int().min(1).max(100).optional(),
      enableBiasDetection: z.boolean().optional(),
      enableVulnTesting: z.boolean().optional(),
      authHeaders: z.record(z.string()).optional(),
      timeout: z.number().int().min(1000).max(30000).optional(),
    })
    .optional(),
});

export function validateScanRequest(req: Request, res: Response, next: NextFunction): void {
  const result = ScanRequestSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: result.error.flatten(),
      },
    });
    return;
  }
  req.body = result.data;
  next();
}
