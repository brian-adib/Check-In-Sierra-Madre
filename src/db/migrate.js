import fs from 'fs/promises';
import path from 'path';
import { db } from './client.js';
import { logger } from '../config/logger.js';

const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations');

async function ensureMigrationsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getExecutedMigrations() {
  const result = await db.execute('SELECT name FROM _migrations');
  return result.rows.map((row) => row.name);
}

async function run() {
  try {
    logger.info('Starting database migration...');
    await ensureMigrationsTable();
    
    const executed = await getExecutedMigrations();
    const files = await fs.readdir(MIGRATIONS_DIR);
    const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      if (executed.includes(file)) {
        logger.info(`Migration already applied: ${file}`);
        continue;
      }

      logger.info(`Applying migration: ${file}`);
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
      
      // Execute multiple statements at once
      await db.executeMultiple(sql);
      
      // Register as executed
      await db.execute({
        sql: 'INSERT INTO _migrations (name) VALUES (?)',
        args: [file],
      });
      logger.info(`Successfully applied: ${file}`);
    }
    
    logger.info('Database migration completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

run();