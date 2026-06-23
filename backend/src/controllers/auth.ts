import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { env } from '../config/env';
import { generateToken } from '../utils/jwt';
import { createError } from '../middleware/error';

interface LoginBody {
  username?: unknown;
  password?: unknown;
}

const TOKEN_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body as LoginBody;
    if (typeof username !== 'string' || username.trim().length === 0) {
      throw createError(400, 'username is required.');
    }
    if (typeof password !== 'string' || password.length === 0) {
      throw createError(400, 'password is required.');
    }

    const user = await User.findOne({ where: { username: username.trim() } });
    if (!user) {
      throw createError(401, 'Invalid credentials.');
    }

    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) {
      throw createError(401, 'Invalid credentials.');
    }

    const token = generateToken({ id: user.id, username: user.username, role: user.role });
    res.cookie(env.cookieName, token, {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: 'strict',
      maxAge: TOKEN_MAX_AGE_MS,
    });

    res.json({ success: true, user: { username: user.username, role: user.role } });
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict',
  });
  res.json({ success: true });
}

export function me(req: Request, res: Response): void {
  res.json({ user: req.user ?? null });
}
