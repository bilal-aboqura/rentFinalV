import app from './app';
import { env } from './config/env';
import { assertDatabaseConnection } from './config/database';
import { logger } from './middleware/logger';

async function main(): Promise<void> {
  try {
    await assertDatabaseConnection();
    logger.info('Database connection established.');
  } catch (err) {
    logger.error('Unable to connect to the database:', err);
    process.exit(1);
  }

  app.listen(env.port, () => {
    logger.info(`API server running on port ${env.port} (${env.nodeEnv})`);
  });
}

void main();
