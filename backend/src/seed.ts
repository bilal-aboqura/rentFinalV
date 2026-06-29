import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertDatabaseConnection } from './config/database.js';
import * as models from './models/index.js';
import type { Models } from './models/types.js';

const SEEDERS_DIR = join(process.cwd(), 'seeders');

interface SeederModule {
  up: (models: Models) => Promise<void>;
}

const modelsBag: Models = {
  sequelize: models.sequelize,
  Location: models.Location,
  Driver: models.Driver,
  User: models.User,
  PricingRule: models.PricingRule,
  Booking: models.Booking,
  Content: models.Content,
  Notification: models.Notification,
  hashPassword: models.hashPassword,
  generateReferenceId: models.generateReferenceId,
};

async function run(): Promise<void> {
  await assertDatabaseConnection();

  const files = readdirSync(SEEDERS_DIR)
    .filter((f) => f.endsWith('.ts'))
    .sort();

  // eslint-disable-next-line no-console
  console.log(`Running ${files.length} seeder(s)...`);

  for (const file of files) {
    const filePath = join(SEEDERS_DIR, file);
    // eslint-disable-next-line no-console
    console.log(`↗ Seeding: ${file}`);
    const mod = (await import(pathToFileURL(filePath).href)) as SeederModule;
    if (typeof mod.up !== 'function') {
      throw new Error(`Seeder ${file} does not export an \`up\` function.`);
    }
    await mod.up(modelsBag);
    // eslint-disable-next-line no-console
    console.log(`✔ Seeded: ${file}`);
  }
  // eslint-disable-next-line no-console
  console.log('Seeding complete.');
  await models.sequelize.close();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seeding failed:', err);
  process.exit(1);
});
