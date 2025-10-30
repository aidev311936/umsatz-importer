import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import pino from 'pino';

const logger = pino({ name: 'error-handler' });

export interface ApiError extends Error {
  status?: number;
  details?: unknown;
}

export const errorHandler = (err: ApiError, req: Request, res: Response, _next: NextFunction) => {
  const status = err.status ?? (err instanceof ZodError ? 422 : 500);
  const payload: Record<string, unknown> = {
    requestId: req.id,
    message: err.message || 'Internal Server Error'
  };

  if (err instanceof ZodError) {
    payload.errors = err.flatten();
  } else if (err.details) {
    payload.details = err.details;
  }

  if (status >= 500) {
    logger.error({ err, requestId: req.id }, 'Unhandled error');
  }

  res.status(status).json(payload);
};
