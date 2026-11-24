import { getDatabase } from '../connection';
import { WorshipNote, CreateWorshipNoteDTO } from '../../types';

export class NotesRepository {
  static async create(data: CreateWorshipNoteDTO): Promise<WorshipNote> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO worship_notes (worship_id, selected_text, note_text, start_offset, end_offset, color_tag)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        data.worship_id,
        data.selected_text.trim(),
        data.note_text.trim(),
        data.start_offset || 0,
        data.end_offset || 0,
        data.color_tag || '#FFD166'
      ]
    );

    const insertedId = result.lastInsertRowId;
    const note = await db.getFirstAsync<WorshipNote>(
      `SELECT * FROM worship_notes WHERE id = ?;`,
      [insertedId]
    );
    if (!note) {
      throw new Error(`Falha ao recuperar anotação criada com id ${insertedId}`);
    }
    return note;
  }

  static async findByWorshipId(worshipId: number): Promise<WorshipNote[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<WorshipNote>(
      `SELECT * FROM worship_notes WHERE worship_id = ? ORDER BY id DESC;`,
      [worshipId]
    );
    return rows;
  }

  static async update(id: number, noteText: string, colorTag?: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `UPDATE worship_notes SET note_text = ?, color_tag = COALESCE(?, color_tag) WHERE id = ?;`,
      [noteText.trim(), colorTag || null, id]
    );
    return result.changes > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync(`DELETE FROM worship_notes WHERE id = ?;`, [id]);
    return result.changes > 0;
  }
}

