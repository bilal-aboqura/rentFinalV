import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z
    .string()
    .default('postgres://postgres:postgres@localhost:5432/airport_transfer_booking'),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  DB_POOL_MIN: z.coerce.number().int().min(0).default(0),
  DB_POOL_ACQUIRE: z.coerce.number().int().positive().default(30000),
  DB_POOL_IDLE: z.coerce.number().int().min(0).default(10000),
  JWT_SECRET: z.string().min(16).default('dev_super_secret_jwt_key_change_me'),
  JWT_EXPIRES_IN: z.string().default('12h'),
  COOKIE_NAME: z.string().default('token'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SMTP_HOST: z.string().default('smtp.mailtrap.io'),
  SMTP_PORT: z.coerce.number().int().positive().default(2525),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('noreply@airporttransfers.com'),
  SMTP_SECURE: z
    .union([z.string(), z.boolean()])
    .default('false')
    .transform((v) => v === true || v === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration.');
}

export const env = parsed.data;
export type Env = typeof env;
