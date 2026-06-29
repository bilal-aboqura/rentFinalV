import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { QueryInterface, Sequelize } from 'sequelize';
import { sequelize, assertDatabaseConnection } from './config/database.js';

interface MigrationModule {
  up: (qi: QueryInterface, sequelize: Sequelize) => Promise<void>;
  down?: (qi: QueryInterface, sequelize: Sequelize) => Promise<void>;
}

const MIGRATIONS_DIR = join(process.cwd(), 'migrations');
const META_TABLE = 'sequelize_meta';

async function ensureMetaTable(qi: QueryInterface): Promise<void> {
  const tables = (await qi.showAllTables()) as string[];
  if (!tables.includes(META_TABLE)) {
    await qi.createTable(META_TABLE, {
      name: {
        type: 'STRING',
        allowNull: false,
        primaryKey: true,
      },
    });
  }
}

async function getAppliedMigrations(qi: QueryInterface): Promise<Set<string>> {
  const [rows] = await qi.sequelize.query(
    `SELECT name FROM ${META_TABLE} ORDER BY name ASC`,
  );
  return new Set((rows as Array<{ name: string }>).map((r) => r.name));
}

async function loadMigrationFiles(): Promise<string[]> {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.ts'))
    .sort();
}

async function run(): Promise<void> {
  await assertDatabaseConnection();
  const qi = sequelize.getQueryInterface();
  await ensureMetaTable(qi);
  const applied = await getAppliedMigrations(qi);
  const files = await loadMigrationFiles();

  // eslint-disable-next-line no-console
  console.log(`Found ${files.length} migration(s); ${applied.size} already applied.`);

  for (const file of files) {
    if (applied.has(file)) continue;
    const filePath = join(MIGRATIONS_DIR, file);
    // eslint-disable-next-line no-console
    console.log(`↗ Applying migration: ${file}`);
    const mod = (await import(pathToFileURL(filePath).href)) as MigrationModule;
    if (typeof mod.up !== 'function') {
      throw new Error(`Migration ${file} does not export an \`up\` function.`);
    }
    await mod.up(qi, sequelize);
    await qi.sequelize.query(`INSERT INTO ${META_TABLE} (name) VALUES (?)`, {
      replacements: [file],
    });
    // eslint-disable-next-line no-console
    console.log(`✔ Applied: ${file}`);
  }
  // eslint-disable-next-line no-console
  console.log('Migrations complete.');
  await sequelize.close();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Migration failed:', err);
  process.exit(1);
});
