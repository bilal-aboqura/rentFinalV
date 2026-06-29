import type { NextFunction, Request, Response } from 'express';

type LoggableRequest = Request & {
  method: string;
  originalUrl: string;
};

export function requestLogger(
  req: LoggableRequest,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
    // eslint-disable-next-line no-console
    console.log(
      `[${new Date().toISOString()}] ${level} ${method} ${originalUrl} ${statusCode} ${duration}ms`,
    );
  });

  next();
}
