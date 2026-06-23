import dotenv from 'dotenv';

dotenv.config();

function parseDatabaseUrl(url: string | undefined) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 5432,
      database: parsed.pathname.replace(/^\//, ''),
      username: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
    };
  } catch {
    return null;
  }
}

const fromUrl = parseDatabaseUrl(process.env.DATABASE_URL);

function requiredString(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

export interface EnvConfig {
  nodeEnv: string;
  isProduction: boolean;
  isTest: boolean;
  port: number;
  db: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    url: string;
  };
  jwtSecret: string;
  jwtExpiresIn: string;
  cookieName: string;
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  corsOrigin: string;
}

const testDatabase = process.env.NODE_ENV === 'test' ? 'airport_transfer_booking_test' : null;

export const env: EnvConfig = {
  nodeEnv: requiredString('NODE_ENV', 'development'),
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: parseInt(process.env.PORT || '5000', 10),
  db: {
    host: fromUrl?.host || process.env.DB_HOST || 'localhost',
    port: fromUrl?.port || parseInt(process.env.DB_PORT || '5432', 10),
    database: testDatabase || fromUrl?.database || process.env.DB_NAME || 'airport_transfer_booking',
    username: fromUrl?.username || process.env.DB_USER || 'postgres',
    password: fromUrl?.password || process.env.DB_PASS || 'postgres',
    url: process.env.DATABASE_URL || '',
  },
  jwtSecret: requiredString('JWT_SECRET', 'super_secret_jwt_key_change_in_production'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  cookieName: 'token',
  smtp: {
    host: requiredString('SMTP_HOST', 'smtp.mailtrap.io'),
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    user: requiredString('SMTP_USER', 'test_smtp_user'),
    pass: requiredString('SMTP_PASS', 'test_smtp_password'),
    from: requiredString('SMTP_FROM', 'noreply@airporttransfers.com'),
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
