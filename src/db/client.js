import { createClient } from '@libsql/client';
import { env } from '../config/env.js';

// Create the database client (Local file or Turso URL)
export const db = createClient({
  url: env.DATABASE_URL,
});