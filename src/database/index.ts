import { getDatabase } from './connection';
import { runMigrations } from './migrations';
import { runSeeds } from './seeds';
import { BibleRepository } from './repositories/BibleRepository';
import { registerVerseLookup } from '../services/bible/BibleReferenceDetector';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function initDatabase(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const db = await getDatabase();
      await runMigrations(db);
      await runSeeds(db);

      // Registra o lookup do SQLite no detector de referências bíblicas
      registerVerseLookup(async (book, chapter, start, end, versionCode) => {
        if (end && end >= start) {
          const verses = await BibleRepository.findVersesRange(book, chapter, start, end, versionCode || 'ARA');
          if (verses.length > 0) {
            return verses.map(v => `${v.verse}. ${v.text}`).join(' ');
          }
        } else {
          const verse = await BibleRepository.findVerse(book, chapter, start, versionCode || 'ARA');
          if (verse) {
            return verse.text;
          }
        }
        return undefined;
      });

      isInitialized = true;
    } catch (err) {
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

export * from './connection';
export * from './repositories/WorshipRepository';
export * from './repositories/NotesRepository';
export * from './repositories/BibleRepository';
