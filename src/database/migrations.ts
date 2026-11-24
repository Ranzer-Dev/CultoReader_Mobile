import { SQLiteDatabase } from 'expo-sqlite';

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS worship_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      preacher TEXT NOT NULL,
      service_date TEXT NOT NULL,
      summary TEXT,
      full_transcript TEXT,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_worship_date ON worship_services(service_date);
    CREATE INDEX IF NOT EXISTS idx_worship_title ON worship_services(title);

    CREATE TABLE IF NOT EXISTS worship_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worship_id INTEGER NOT NULL,
      selected_text TEXT NOT NULL,
      note_text TEXT NOT NULL,
      start_offset INTEGER DEFAULT 0,
      end_offset INTEGER DEFAULT 0,
      color_tag TEXT DEFAULT '#FFD166',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (worship_id) REFERENCES worship_services(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_notes_worship ON worship_notes(worship_id);

    CREATE TABLE IF NOT EXISTS bible_versions (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      language TEXT NOT NULL,
      is_default INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS bible_verses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_code TEXT NOT NULL,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      FOREIGN KEY (version_code) REFERENCES bible_versions(code) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_bible_lookup ON bible_verses(version_code, book, chapter, verse);

    CREATE INDEX IF NOT EXISTS idx_verses_lookup ON bible_verses(version_code, book, chapter, verse);

    CREATE TABLE IF NOT EXISTS detected_verses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worship_id INTEGER,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse_start INTEGER NOT NULL,
      verse_end INTEGER,
      full_text TEXT,
      version_code TEXT DEFAULT 'ARA',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (worship_id) REFERENCES worship_services(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bible_highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_code TEXT NOT NULL,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      color_hex TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bible_hl_unique ON bible_highlights(version_code, book, chapter, verse);
    CREATE INDEX IF NOT EXISTS idx_bible_hl_loc ON bible_highlights(book, chapter);

    CREATE TABLE IF NOT EXISTS bible_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_code TEXT NOT NULL,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      note_text TEXT NOT NULL,
      color_tag TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_bible_notes_loc ON bible_notes(book, chapter, verse);
  `);
}

