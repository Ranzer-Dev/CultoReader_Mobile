import * as SQLite from 'expo-sqlite';

let databaseInstance: SQLite.SQLiteDatabase | null = null;
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Singleton thread-safe para conexão SQLite.
 * Garante que múltiplas telas/providers inicializando ao mesmo tempo
 * nunca abram conexões duplicadas nem causem deadlock (SQLITE_BUSY).
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (databaseInstance) {
    return databaseInstance;
  }

  if (!databasePromise) {
    databasePromise = (async () => {
      try {
        const db = await SQLite.openDatabaseAsync('culto_compreensao.db');
        await db.execAsync(`
          PRAGMA busy_timeout = 5000;
          PRAGMA foreign_keys = ON;
          PRAGMA journal_mode = WAL;
        `);
        databaseInstance = db;
        return db;
      } catch (err) {
        databasePromise = null;
        throw err;
      }
    })();
  }

  return databasePromise;
}
