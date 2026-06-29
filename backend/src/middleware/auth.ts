import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthedRequest, JwtUser } from '../types/index.js';
import { HttpError } from './error.js';

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authed = req as AuthedRequest;
  const token = req.cookies?.[env.COOKIE_NAME];
  if (!token) {
    next(new HttpError(401, 'Authentication required.'));
    return;
  }

  let payload: JwtUser;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as JwtUser;
  } catch {
    next(new HttpError(401, 'Invalid or expired session.'));
    return;
  }

  if (payload.role !== 'admin') {
    next(new HttpError(403, 'Insufficient permissions.'));
    return;
  }

  authed.user = payload;
  next();
}
