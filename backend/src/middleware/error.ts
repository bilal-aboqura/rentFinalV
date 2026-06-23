import type { ErrorRequestHandler, RequestHandler } from 'express';
import { logger } from './logger';

export interface AppError extends Error {
  status?: number;
  code?: string;
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Resource not found.' });
};

export const errorHandler: ErrorRequestHandler = (err: AppError, req, res, _next) => {
  const status = err.status ?? 500;
  const message = err.message || 'Internal server error.';

  if (status >= 500) {
    logger.error(`[${req.method} ${req.originalUrl}]`, err.stack || err.message);
  } else {
    logger.warn(`[${req.method} ${req.originalUrl}] ${status} - ${message}`);
  }

  if (process.env.NODE_ENV === 'production' && status >= 500) {
    return res.status(status).json({ error: 'Internal server error.' });
  }

  return res.status(status).json({ error: message });
};

export function createError(status: number, message: string): AppError {
  const error = new Error(message) as AppError;
  error.status = status;
  return error;
}
