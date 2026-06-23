import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { Request, Response, NextFunction } from 'express';
import app from '../../src/app';
import { sequelize, resetDatabase, syncDatabase, seedFixtures, type SeedFixtures } from '../helpers/db';
import { generateToken } from '../../src/utils/jwt';
import { requireAuth } from '../../src/middleware/auth';

let fixtures: SeedFixtures;

beforeAll(async () => {
  await syncDatabase();
});

beforeEach(async () => {
  await resetDatabase();
  fixtures = await seedFixtures();
});

afterAll(async () => {
  await sequelize.close();
});

describe('US2 - Admin Auth', () => {
  describe('POST /api/admin/login', () => {
    it('issues a token cookie for valid credentials', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ username: 'admin', password: 'SecurePassword123' })
        .expect(200);

      expect(res.body).toEqual({ success: true, user: { username: 'admin', role: 'admin' } });
      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      expect(cookie).toContain('token=');
      expect(cookie.toLowerCase()).toContain('httponly');
    });

    it('rejects an incorrect password with 401', async () => {
      const res = await request(app)
        .post('/api/admin/login')
        .send({ username: 'admin', password: 'wrong-password' })
        .expect(401);
      expect(res.body).toHaveProperty('error');
    });

    it('rejects an unknown user with 401', async () => {
      await request(app)
        .post('/api/admin/login')
        .send({ username: 'ghost', password: 'whatever' })
        .expect(401);
    });

    it('rejects missing fields with 400', async () => {
      await request(app).post('/api/admin/login').send({ username: 'admin' }).expect(400);
    });
  });

  describe('POST /api/admin/logout', () => {
    it('clears the token cookie', async () => {
      const res = await request(app).post('/api/admin/logout').expect(200);
      expect(res.body).toEqual({ success: true });
      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
    });
  });

  describe('requireAuth middleware', () => {
    function buildReq(cookie?: string): Partial<Request> {
      return {
        headers: cookie ? { cookie } : {},
      };
    }

    function buildRes(): Partial<Response> {
      const statusMock = vi.fn().mockReturnThis();
      const jsonMock = vi.fn().mockReturnThis();
      return { status: statusMock, json: jsonMock };
    }

    it('blocks requests without a token cookie (401)', async () => {
      const req = buildReq() as Request;
      const res = buildRes() as Response;
      const next = vi.fn() as NextFunction;
      await requireAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('blocks requests with an invalid token (401)', async () => {
      const req = buildReq('token=invalid.value.here') as Request;
      const res = buildRes() as Response;
      const next = vi.fn() as NextFunction;
      await requireAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('allows requests with a valid token and attaches the user', async () => {
      const token = generateToken({ id: fixtures.adminId, username: 'admin', role: 'admin' });
      const req = buildReq(`token=${token}`) as Request;
      const res = buildRes() as Response;
      const next = vi.fn() as NextFunction;
      await requireAuth(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect((req as Partial<Request> & { user?: unknown }).user).toBeTruthy();
    });
  });
});
