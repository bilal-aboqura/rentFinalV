import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

export class HttpError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Resource not found.' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    const body: { error: string; details?: unknown } = { error: err.message };
    if (err.details !== undefined) body.details = err.details;
    res.status(err.statusCode).json(body);
    return;
  }

  if (isSequelizeValidationError(err)) {
    const message = extractValidationMessage(err);
    res.status(400).json({ error: message });
    return;
  }

  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  const message =
    env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err instanceof Error
        ? err.message
        : 'Internal server error.';
  res.status(500).json({ error: message });
}

interface SequelizeValidationErrorLike {
  name: string;
  message?: string;
  errors?: Array<{ message?: string }>;
}

function isSequelizeValidationError(err: unknown): err is SequelizeValidationErrorLike {
  if (typeof err !== 'object' || err === null) return false;
  const name = (err as { name?: string }).name;
  return (
    name === 'SequelizeValidationError' ||
    name === 'SequelizeUniqueConstraintError' ||
    name === 'SequelizeDatabaseError'
  );
}

function extractValidationMessage(err: SequelizeValidationErrorLike): string {
  if (err.name === 'SequelizeUniqueConstraintError') {
    return 'A record with these details already exists.';
  }
  if (err.errors && err.errors.length > 0) {
    return err.errors.map((e) => e.message).join(', ');
  }
  return err.message ?? 'Validation error.';
}

export type { SequelizeValidationErrorLike };
