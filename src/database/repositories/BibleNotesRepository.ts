import { getDatabase } from '../connection';
import { BibleHighlight, BibleNote } from '../../types';

export class BibleNotesRepository {
  /**
   * Obtém os grifos de um capítulo
   */
  static async getHighlights(
    versionCode: string,
    book: string,
    chapter: number
  ): Promise<BibleHighlight[]> {
    const db = await getDatabase();
    try {
      const rows = await db.getAllAsync<BibleHighlight>(
        `SELECT * FROM bible_highlights 
         WHERE version_code = ? AND LOWER(book) = LOWER(?) AND chapter = ?;`,
        [versionCode, book.trim(), chapter]
      );
      return rows;
    } catch {
      return [];
    }
  }

  /**
   * Salva ou atualiza um grifo
   */
  static async setHighlight(
    versionCode: string,
    book: string,
    chapter: number,
    verse: number,
    colorHex: string
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO bible_highlights (version_code, book, chapter, verse, color_hex)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(version_code, book, chapter, verse)
       DO UPDATE SET color_hex = excluded.color_hex;`,
      [versionCode, book.trim(), chapter, verse, colorHex]
    );
  }

  /**
   * Remove o grifo de um versículo
   */
  static async removeHighlight(
    versionCode: string,
    book: string,
    chapter: number,
    verse: number
  ): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM bible_highlights 
       WHERE version_code = ? AND LOWER(book) = LOWER(?) AND chapter = ? AND verse = ?;`,
      [versionCode, book.trim(), chapter, verse]
    );
  }

  /**
   * Obtém as anotações de um capítulo
   */
  static async getNotes(
    versionCode: string,
    book: string,
    chapter: number
  ): Promise<BibleNote[]> {
    const db = await getDatabase();
    try {
      const rows = await db.getAllAsync<BibleNote>(
        `SELECT * FROM bible_notes 
         WHERE version_code = ? AND LOWER(book) = LOWER(?) AND chapter = ?
         ORDER BY verse ASC;`,
        [versionCode, book.trim(), chapter]
      );
      return rows;
    } catch {
      return [];
    }
  }

  /**
   * Salva ou edita uma anotação de versículo
   */
  static async saveNote(
    versionCode: string,
    book: string,
    chapter: number,
    verse: number,
    noteText: string,
    colorTag: string = '#FFEAA7'
  ): Promise<BibleNote> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<BibleNote>(
      `SELECT * FROM bible_notes 
       WHERE version_code = ? AND LOWER(book) = LOWER(?) AND chapter = ? AND verse = ?;`,
      [versionCode, book.trim(), chapter, verse]
    );

    if (existing) {
      await db.runAsync(
        `UPDATE bible_notes 
         SET note_text = ?, color_tag = ?, updated_at = datetime('now', 'localtime')
         WHERE id = ?;`,
        [noteText.trim(), colorTag, existing.id]
      );
      return {
        ...existing,
        note_text: noteText.trim(),
        color_tag: colorTag
      };
    } else {
      const result = await db.runAsync(
        `INSERT INTO bible_notes (version_code, book, chapter, verse, note_text, color_tag)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [versionCode, book.trim(), chapter, verse, noteText.trim(), colorTag]
      );
      return {
        id: result.lastInsertRowId,
        version_code: versionCode,
        book: book.trim(),
        chapter,
        verse,
        note_text: noteText.trim(),
        color_tag: colorTag
      };
    }
  }

  /**
   * Deleta uma anotação por ID
   */
  static async deleteNote(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM bible_notes WHERE id = ?;`, [id]);
  }

  /**
   * Lista todas as anotações feitas pelo usuário para visualização geral
   */
  static async getAllNotes(): Promise<BibleNote[]> {
    const db = await getDatabase();
    try {
      const rows = await db.getAllAsync<BibleNote>(
        `SELECT * FROM bible_notes ORDER BY created_at DESC;`
      );
      return rows;
    } catch {
      return [];
    }
  }

  /**
   * Lista todos os grifos feitos pelo usuário
   */
  static async getAllHighlights(): Promise<BibleHighlight[]> {
    const db = await getDatabase();
    try {
      const rows = await db.getAllAsync<BibleHighlight>(
        `SELECT * FROM bible_highlights ORDER BY created_at DESC;`
      );
      return rows;
    } catch {
      return [];
    }
  }
}
