import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../../src/models/index.js', () => {
  const User = {
    findOne: vi.fn(),
  };
  return { User };
});

const { User } = await import('../../src/models/index.js');
const { login, logout } = await import('../../src/controllers/auth.js');
const { authenticate } = await import('../../src/middleware/auth.js');

function mockUser(overrides: Record<string, unknown> = {}): {
  username: string;
  password_hash: string;
  role: string;
  verifyPassword: ReturnType<typeof vi.fn>;
} & Record<string, unknown> {
  return {
    username: 'admin',
    password_hash: 'hashed',
    role: 'admin',
    verifyPassword: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

function mockRes(): Response & {
  statusCode: number;
  body: unknown;
  cookie: ReturnType<typeof vi.fn>;
  clearCookie: ReturnType<typeof vi.fn>;
} {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };
  return res as unknown as Response & {
    statusCode: number;
    body: unknown;
    cookie: ReturnType<typeof vi.fn>;
    clearCookie: ReturnType<typeof vi.fn>;
  };
}

describe('Auth controller (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('issues a JWT cookie for valid credentials', async () => {
      (User.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser());
      const req = {
        body: { username: 'admin', password: 'SecurePassword123' },
      } as unknown as Request;
      const res = mockRes();

      await login(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        user: { username: 'admin', role: 'admin' },
      });
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
        }),
      );
    });

    it('rejects unknown user with 401', async () => {
      (User.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const req = { body: { username: 'ghost', password: 'x' } } as unknown as Request;
      const res = mockRes();

      await expect(login(req, res)).rejects.toMatchObject({ statusCode: 401 });
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('rejects wrong password with 401', async () => {
      (User.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser({ verifyPassword: vi.fn().mockResolvedValue(false) }),
      );
      const req = {
        body: { username: 'admin', password: 'wrong' },
      } as unknown as Request;
      const res = mockRes();

      await expect(login(req, res)).rejects.toMatchObject({ statusCode: 401 });
    });

    it('returns 400 when fields are missing', async () => {
      const req = { body: { username: '' } } as unknown as Request;
      const res = mockRes();

      await expect(login(req, res)).rejects.toMatchObject({ statusCode: 400 });
      expect(User.findOne).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('clears the auth cookie', async () => {
      const res = mockRes();
      await logout({} as Request, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({ success: true });
      expect(res.clearCookie).toHaveBeenCalledWith('token', expect.any(Object));
    });
  });
});

describe('authenticate middleware (unit)', () => {
  function mockReq(cookies: Record<string, string> = {}): Request {
    return { cookies } as unknown as Request;
  }

  it('calls next and attaches user for a valid token', async () => {
    const { signToken } = await import('../../src/controllers/auth.js');
    const token = signToken({ id: 1, username: 'admin', role: 'admin' });
    const req = mockReq({ token });
    const next = vi.fn();

    authenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(); // no error
    expect((req as { user?: { username: string } }).user?.username).toBe('admin');
  });

  it('returns a 401 error via next when no token cookie is present', () => {
    const req = mockReq({});
    const next = vi.fn();

    authenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('returns a 401 error via next for a malformed token', () => {
    const req = mockReq({ token: 'not-a-real-jwt' });
    const next = vi.fn();

    authenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});
