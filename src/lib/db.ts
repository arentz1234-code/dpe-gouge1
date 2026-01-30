import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'dpe-gouge.db');
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.exec(`
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

  // Add website column if it doesn't exist (for existing databases)
  try {
    database.exec('ALTER TABLE examiners ADD COLUMN website TEXT');
  } catch {
    // Column already exists
  }

  database.exec(`
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

  database.exec(`
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

export function query<T>(sql: string, params: unknown[] = []): T[] {
  const database = getDb();
  const stmt = database.prepare(sql);
  return stmt.all(...params) as T[];
}

export function run(sql: string, params: unknown[] = []) {
  const database = getDb();
  const stmt = database.prepare(sql);
  return stmt.run(...params);
}

export function get<T>(sql: string, params: unknown[] = []): T | undefined {
  const database = getDb();
  const stmt = database.prepare(sql);
  return stmt.get(...params) as T | undefined;
}
