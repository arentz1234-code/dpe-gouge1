import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function initDb() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS examiners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      state TEXT NOT NULL,
      certificates TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      website TEXT,
      added_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS gouges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      examiner_id INTEGER NOT NULL REFERENCES examiners(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      checkride_type TEXT NOT NULL,
      checkride_date DATE,
      outcome TEXT NOT NULL,
      quality_rating INTEGER NOT NULL CHECK(quality_rating >= 1 AND quality_rating <= 5),
      difficulty_rating INTEGER NOT NULL CHECK(difficulty_rating >= 1 AND difficulty_rating <= 5),
      would_recommend INTEGER NOT NULL,
      tags TEXT,
      comment TEXT NOT NULL,
      oral_topics TEXT,
      flight_maneuvers TEXT,
      tips TEXT,
      thumbs_up INTEGER DEFAULT 0,
      thumbs_down INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gouge_id INTEGER NOT NULL REFERENCES gouges(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      vote_type INTEGER NOT NULL CHECK(vote_type IN (-1, 1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(gouge_id, user_id)
    )
  `);

  return { success: true };
}

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await client.execute({ sql, args: params as any[] });
  return result.rows as T[];
}

export async function run(sql: string, params: unknown[] = []) {
  const result = await client.execute({ sql, args: params as any[] });
  return { lastInsertRowid: result.lastInsertRowid };
}

export async function get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const result = await client.execute({ sql, args: params as any[] });
  return result.rows[0] as T | undefined;
}
