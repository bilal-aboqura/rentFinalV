import { Sequelize } from 'sequelize';
import { env } from './env.js';

interface ParsedUri {
  username: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

function parseDatabaseUri(uri: string): ParsedUri {
  // Format: postgres://user:password@host:port/database
  const match = uri.match(
    /^postgres(?:ql)?:\/\/([^:]*):([^@]*)@([^:]+):(\d+)\/(.+)$/,
  );
  if (!match) {
    throw new Error(`Invalid DATABASE_URL format: ${uri}`);
  }
  const [, username, password, host, port, database] = match;
  return {
    username: decodeURIComponent(username),
    password: decodeURIComponent(password),
    host,
    port: Number(port),
    database,
  };
}

const baseOptions = {
  dialect: 'postgres' as const,
  logging: env.NODE_ENV === 'development' ? undefined : false,
  pool: {
    max: env.DB_POOL_MAX,
    min: env.DB_POOL_MIN,
    acquire: env.DB_POOL_ACQUIRE,
    idle: env.DB_POOL_IDLE,
  },
  define: {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
};

const parsed =
  env.NODE_ENV === 'production' && env.DATABASE_URL
    ? parseDatabaseUri(env.DATABASE_URL)
    : null;

export const sequelize = parsed
  ? new Sequelize({
      database: parsed.database,
      username: parsed.username,
      password: parsed.password,
      host: parsed.host,
      port: parsed.port,
      ...baseOptions,
    })
  : new Sequelize(env.DATABASE_URL, baseOptions);

export async function assertDatabaseConnection(): Promise<void> {
  await sequelize.authenticate();
}

export type { ParsedUri };
