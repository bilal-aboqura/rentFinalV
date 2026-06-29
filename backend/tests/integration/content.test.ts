import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/models/index.js', () => {
  const Content = {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
  };
  return { Content };
});

const { Content } = await import('../../src/models/index.js');
const { createApp } = await import('../../src/app.js');
const { signToken } = await import('../../src/controllers/auth.js');

const TOKEN = signToken({ id: 1, username: 'admin', role: 'admin' });

function instance(data: Record<string, unknown>) {
  return {
    ...data,
    save: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
  };
}

describe('User Story 5 - Content Management (integration)', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
  });

  describe('Public content', () => {
    it('returns FAQ items for the customer site', async () => {
      (Content.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([
        instance({
          id: 1,
          key: 'faq_1',
          value: '{"question":"How do I cancel?","answer":"Contact us."}',
        }),
      ]);

      const res = await request(app).get('/api/content/faq');

      expect(res.status).toBe(200);
      expect(res.body[0]).toMatchObject({ key: 'faq_1' });
      const call = (Content.findAll as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(call.where.key[Symbol.for('like')]).toBeDefined();
    });
  });

  describe('Admin content CRUD', () => {
    it('rejects unauthenticated access', async () => {
      const res = await request(app).get('/api/admin/content');
      expect(res.status).toBe(401);
    });

    it('lists all content when authenticated', async () => {
      (Content.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([
        instance({ id: 1, key: 'hero_title', value: 'Welcome' }),
      ]);

      const res = await request(app)
        .get('/api/admin/content')
        .set('Cookie', [`token=${TOKEN}`]);

      expect(res.status).toBe(200);
      expect(res.body[0]).toMatchObject({ key: 'hero_title' });
    });

    it('creates a content entry', async () => {
      (Content.create as ReturnType<typeof vi.fn>).mockResolvedValue(
        instance({ id: 5, key: 'hero_title', value: 'New Hero' }),
      );

      const res = await request(app)
        .post('/api/admin/content')
        .set('Cookie', [`token=${TOKEN}`])
        .send({ key: 'hero_title', value: 'New Hero' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ key: 'hero_title' });
    });

    it('updates an existing content entry', async () => {
      (Content.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(
        instance({ id: 5, key: 'hero_title', value: 'Old' }),
      );

      const res = await request(app)
        .patch('/api/admin/content/hero_title')
        .set('Cookie', [`token=${TOKEN}`])
        .send({ value: 'Updated Hero' });

      expect(res.status).toBe(200);
    });

    it('returns 404 when updating a missing content entry', async () => {
      (Content.findOne as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/admin/content/missing')
        .set('Cookie', [`token=${TOKEN}`])
        .send({ value: 'X' });

      expect(res.status).toBe(404);
    });

    it('deletes a content entry', async () => {
      const item = instance({ id: 5, key: 'faq_1' });
      (Content.findByPk as ReturnType<typeof vi.fn>).mockResolvedValue(item);

      const res = await request(app)
        .delete('/api/admin/content/5')
        .set('Cookie', [`token=${TOKEN}`]);

      expect(res.status).toBe(200);
      expect(item.destroy).toHaveBeenCalled();
    });
  });
});
