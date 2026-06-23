import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { sequelize, resetDatabase, syncDatabase, seedFixtures, type SeedFixtures } from '../helpers/db';

let fixtures: SeedFixtures;
let cookie: string;

beforeAll(async () => {
  await syncDatabase();
});

beforeEach(async () => {
  await resetDatabase();
  fixtures = await seedFixtures();
  const res = await request(app)
    .post('/api/admin/login')
    .send({ username: 'admin', password: 'SecurePassword123' });
  const setCookie = res.headers['set-cookie'];
  cookie = (Array.isArray(setCookie) ? setCookie[0] : setCookie).split(';')[0];
});

afterAll(async () => {
  await sequelize.close();
});

void fixtures;

const faqValue = (question: string, answer: string) => JSON.stringify({ question, answer });

describe('US5 - Content Management', () => {
  describe('Public content endpoints', () => {
    it('returns all content entries', async () => {
      await request(app)
        .post('/api/admin/content')
        .set('Cookie', cookie)
        .send({ key: 'hero_title', value: 'Welcome', description: 'Hero' })
        .expect(201);

      const res = await request(app).get('/api/content').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((c: { key: string }) => c.key === 'hero_title')).toBe(true);
    });

    it('returns only FAQ entries', async () => {
      await request(app)
        .post('/api/admin/content')
        .set('Cookie', cookie)
        .send({ key: 'faq_10', value: faqValue('How early?', '2 hours before.') })
        .expect(201);

      const res = await request(app).get('/api/content/faq').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      for (const entry of res.body) {
        expect(entry.key).toMatch(/^faq_/);
      }
      const created = res.body.find((c: { key: string }) => c.key === 'faq_10');
      expect(created).toBeDefined();
    });
  });

  describe('Admin content CRUD', () => {
    it('creates, updates, and deletes content', async () => {
      const created = await request(app)
        .post('/api/admin/content')
        .set('Cookie', cookie)
        .send({ key: 'faq_20', value: faqValue('Question?', 'Answer.') })
        .expect(201);
      expect(created.body).toMatchObject({ key: 'faq_20' });
      const id = created.body.id;

      const updated = await request(app)
        .patch(`/api/admin/content/${id}`)
        .set('Cookie', cookie)
        .send({ value: faqValue('Question?', 'Updated answer.') })
        .expect(200);
      expect(updated.body.value).toContain('Updated answer.');

      const publicFaq = await request(app).get('/api/content/faq').expect(200);
      const entry = publicFaq.body.find((c: { id: number }) => c.id === id || c.key === 'faq_20');
      expect(entry.value).toContain('Updated answer.');

      await request(app).delete(`/api/admin/content/${id}`).set('Cookie', cookie).expect(200);
    });

    it('rejects duplicate keys', async () => {
      await request(app)
        .post('/api/admin/content')
        .set('Cookie', cookie)
        .send({ key: 'unique_key', value: 'one' })
        .expect(201);
      await request(app)
        .post('/api/admin/content')
        .set('Cookie', cookie)
        .send({ key: 'unique_key', value: 'two' })
        .expect(400);
    });
  });
});
