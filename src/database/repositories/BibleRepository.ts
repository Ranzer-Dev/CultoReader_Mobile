import { getDatabase } from '../connection';
import { BibleVerse } from '../../types';
import { BibleManager } from '../../services/bible/BibleManager';

export class BibleRepository {
  static async findVerse(
    book: string,
    chapter: number,
    verse: number,
    versionCode: string = 'NVI'
  ): Promise<BibleVerse | null> {
    const db = await getDatabase();
    // 1. Tenta buscar no SQLite
    try {
      const row = await db.getFirstAsync<BibleVerse>(
        `SELECT * FROM bible_verses 
         WHERE version_code = ? AND LOWER(book) = LOWER(?) AND chapter = ? AND verse = ?;`,
        [versionCode, book.trim(), chapter, verse]
      );
      if (row) return row;
    } catch {}

    // 2. Fallback para o BibleManager (assets nativos offline: NVI, KJV, RVR)
    try {
      const text = await BibleManager.getVerseText(versionCode, book, chapter, verse);
      if (text) {
        return {
          id: 0,
          version_code: versionCode,
          book,
          chapter,
          verse,
          text
        };
      }
    } catch (e) {
      console.warn('Erro ao buscar versículo no BibleManager:', e);
    }

    return null;
  }

  static async findVersesRange(
    book: string,
    chapter: number,
    startVerse: number,
    endVerse: number,
    versionCode: string = 'NVI'
  ): Promise<BibleVerse[]> {
    const db = await getDatabase();
    // 1. Tenta buscar no SQLite
    try {
      const rows = await db.getAllAsync<BibleVerse>(
        `SELECT * FROM bible_verses 
         WHERE version_code = ? AND LOWER(book) = LOWER(?) AND chapter = ? AND verse >= ? AND verse <= ?
         ORDER BY verse ASC;`,
        [versionCode, book.trim(), chapter, startVerse, endVerse]
      );
      if (rows && rows.length > 0) return rows;
    } catch {}

    // 2. Fallback para o BibleManager (assets nativos offline)
    try {
      const verses = await BibleManager.getChapterVerses(versionCode, book, chapter);
      if (verses && verses.length > 0) {
        const result: BibleVerse[] = [];
        for (let v = startVerse; v <= endVerse && v <= verses.length; v++) {
          if (v >= 1 && verses[v - 1]) {
            result.push({
              id: 0,
              version_code: versionCode,
              book,
              chapter,
              verse: v,
              text: verses[v - 1]
            });
          }
        }
        return result;
      }
    } catch (e) {
      console.warn('Erro ao buscar intervalo no BibleManager:', e);
    }

    return [];
  }

  static async listVersions(): Promise<{ code: string; name: string; language: string; is_default: number }[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ code: string; name: string; language: string; is_default: number }>(
      `SELECT * FROM bible_versions ORDER BY is_default DESC, name ASC;`
    );
    return rows;
  }

  static async searchByText(query: string, versionCode: string = 'ARA', limit: number = 20): Promise<BibleVerse[]> {
    const db = await getDatabase();
    const term = `%${query.trim()}%`;
    const rows = await db.getAllAsync<BibleVerse>(
      `SELECT * FROM bible_verses 
       WHERE version_code = ? AND text LIKE ?
       LIMIT ?;`,
      [versionCode, term, limit]
    );
    return rows;
  }
}

