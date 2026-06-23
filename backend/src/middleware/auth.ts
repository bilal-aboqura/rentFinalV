import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { verifyToken, type JwtPayload } from '../utils/jwt';
import { createError } from './error';

function readCookieHeader(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rest] = part.split('=');
    if (rawKey && rawKey.trim() === name) {
      return decodeURIComponent(rest.join('=').trim());
    }
  }
  return null;
}

export function parseTokenFromCookies(req: Request): string | null {
  const fromParsed = (req.cookies as Record<string, string> | undefined)?.[env.cookieName];
  if (typeof fromParsed === 'string' && fromParsed.length > 0) return fromParsed;
  return readCookieHeader(req.headers.cookie, env.cookieName);
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = parseTokenFromCookies(req);
    if (!token) {
      throw createError(401, 'Authentication required.');
    }
    const payload: JwtPayload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    next(createError(401, 'Invalid or expired session.'));
  }
}
