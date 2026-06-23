import morgan, { type StreamOptions } from 'morgan';
import { env } from '../config/env';

type LogMethod = (message?: unknown, ...optionalParams: unknown[]) => void;

export interface Logger {
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  debug: LogMethod;
}

export const logger: Logger = {
  info: (...args) => console.log('[info]', ...args),
  warn: (...args) => console.warn('[warn]', ...args),
  error: (...args) => console.error('[error]', ...args),
  debug: (...args) => {
    if (!env.isProduction) console.log('[debug]', ...args);
  },
};

const stream: StreamOptions = {
  write: (message) => {
    const trimmed = message.trim();
    if (trimmed.length > 0) logger.info(trimmed);
  },
};

const format = env.isProduction ? 'combined' : 'dev';

export const httpLogger = morgan(format, { stream });

export const requestLogger = httpLogger;
