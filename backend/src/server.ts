import { createApp } from './app.js';
import { sequelize, assertDatabaseConnection } from './config/database.js';
import { env } from './config/env.js';

async function start(): Promise<void> {
  await assertDatabaseConnection();
  // eslint-disable-next-line no-console
  console.log(`[db] PostgreSQL connection established.`);

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[api] Server listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n[shutdown] ${signal} received, closing server…`);
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[fatal] Failed to start server:', err);
  process.exit(1);
});
