import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/index.js';
import { env } from '../config/env.js';
import type { JwtUser } from '../types/index.js';
import { HttpError } from '../middleware/error.js';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export function signToken(user: JwtUser): string {
  return jwt.sign(user, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`,
  });
}

function cookieOptions() {
  const maxAgeMs = parseDurationToMs(env.JWT_EXPIRES_IN);
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: maxAgeMs,
  };
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, 'Username and password are required.', parsed.error.flatten());
  }
  const { username, password } = parsed.data;

  const user = await User.findOne({ where: { username } });
  if (!user) {
    throw new HttpError(401, 'Invalid username or password.');
  }

  const valid = await user.verifyPassword(password);
  if (!valid) {
    throw new HttpError(401, 'Invalid username or password.');
  }

  const token = signToken({
    id: user.id,
    username: user.username,
    role: user.role,
  });

  res.cookie(env.COOKIE_NAME, token, cookieOptions());
  res.json({
    success: true,
    user: { username: user.username, role: user.role },
  });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie(env.COOKIE_NAME, cookieOptions());
  res.json({ success: true });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = (req as { user?: JwtUser }).user;
  if (!user) {
    throw new HttpError(401, 'Authentication required.');
  }
  res.json({ user: { username: user.username, role: user.role } });
}

function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 12 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * multipliers[unit];
}
