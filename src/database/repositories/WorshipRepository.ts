import { getDatabase } from '../connection';
import {
  WorshipService,
  CreateWorshipDTO,
  UpdateWorshipDTO,
  PaginationParams,
  PaginatedResult
} from '../../types';

export class WorshipRepository {
  static async create(data: CreateWorshipDTO): Promise<WorshipService> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `INSERT INTO worship_services (title, preacher, service_date, summary, full_transcript, tags)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        data.title.trim(),
        data.preacher.trim(),
        data.service_date.trim(),
        data.summary?.trim() || '',
        data.full_transcript?.trim() || '',
        data.tags?.trim() || ''
      ]
    );

    const insertedId = result.lastInsertRowId;
    const item = await this.findById(insertedId);
    if (!item) {
      throw new Error(`Falha ao recuperar o registro recém-criado com id ${insertedId}`);
    }
    return item;
  }

  static async findById(id: number): Promise<WorshipService | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<WorshipService>(
      `SELECT * FROM worship_services WHERE id = ?;`,
      [id]
    );
    return row || null;
  }

  static async findPaginated(params: PaginationParams): Promise<PaginatedResult<WorshipService>> {
    const db = await getDatabase();
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, params.pageSize || 5);
    const offset = (page - 1) * pageSize;

    const whereClauses: string[] = [];
    const queryArgs: (string | number)[] = [];

    if (params.search && params.search.trim().length > 0) {
      const term = `%${params.search.trim()}%`;
      whereClauses.push('(title LIKE ? OR preacher LIKE ? OR tags LIKE ? OR summary LIKE ?)');
      queryArgs.push(term, term, term, term);
    }

    if (params.date && params.date.trim().length > 0) {
      whereClauses.push('service_date = ?');
      queryArgs.push(params.date.trim());
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Contagem total
    const countSql = `SELECT COUNT(*) as total FROM worship_services ${whereSql};`;
    const countResult = await db.getFirstAsync<{ total: number }>(countSql, queryArgs);
    const total = countResult ? countResult.total : 0;
    const totalPages = Math.ceil(total / pageSize) || 1;

    // Busca paginada
    const dataSql = `
      SELECT * FROM worship_services
      ${whereSql}
      ORDER BY service_date DESC, id DESC
      LIMIT ? OFFSET ?;
    `;
    const dataArgs = [...queryArgs, pageSize, offset];
    const data = await db.getAllAsync<WorshipService>(dataSql, dataArgs);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }

  static async update(id: number, data: UpdateWorshipDTO): Promise<boolean> {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title.trim());
    }
    if (data.preacher !== undefined) {
      fields.push('preacher = ?');
      values.push(data.preacher.trim());
    }
    if (data.service_date !== undefined) {
      fields.push('service_date = ?');
      values.push(data.service_date.trim());
    }
    if (data.summary !== undefined) {
      fields.push('summary = ?');
      values.push(data.summary.trim());
    }
    if (data.full_transcript !== undefined) {
      fields.push('full_transcript = ?');
      values.push(data.full_transcript.trim());
    }
    if (data.tags !== undefined) {
      fields.push('tags = ?');
      values.push(data.tags.trim());
    }

    if (fields.length === 0) return false;

    fields.push("updated_at = datetime('now', 'localtime')");
    values.push(id);

    const updateSql = `UPDATE worship_services SET ${fields.join(', ')} WHERE id = ?;`;
    const result = await db.runAsync(updateSql, values);
    return result.changes > 0;
  }

  static async delete(id: number): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync(`DELETE FROM worship_services WHERE id = ?;`, [id]);
    return result.changes > 0;
  }

  static async listAllCalendarDates(): Promise<{ service_date: string; count: number; titles: string }[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ service_date: string; count: number; titles: string }>(`
      SELECT 
        service_date, 
        COUNT(id) as count, 
        GROUP_CONCAT(title, ' | ') as titles 
      FROM worship_services 
      GROUP BY service_date 
      ORDER BY service_date ASC;
    `);
    return rows;
  }

  /**
   * Atualiza EXCLUSIVAMENTE a transcrição da gravação em andamento (salva-guarda contra desligamento).
   * Jamais sobrescreve título, preletor, tags ou resumo definidos ou editados pelo usuário.
   */
  static async updateTranscriptOnly(id: number, transcript: string): Promise<boolean> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `UPDATE worship_services 
       SET full_transcript = ?, updated_at = datetime('now', 'localtime') 
       WHERE id = ?;`,
      [transcript.trim(), id]
    );
    return result.changes > 0;
  }

  /**
   * Cria o rascunho inicial de segurança para o culto em andamento.
   */
  static async createLiveDraft(transcript: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const created = await this.create({
      title: `Culto em Andamento (${time})`,
      preacher: 'Pregador',
      service_date: today,
      summary: '',
      full_transcript: transcript,
      tags: 'Rascunho Ao Vivo'
    });
    return created.id;
  }

  /**
   * Salva ou atualiza continuamente o rascunho da pregação em tempo real.
   * Não cria linhas duplicadas ou novas tabelas; reutiliza a mesma sessão.
   */
  static async upsertLiveDraft(
    currentId: number | null,
    transcript: string,
    detectedVersesSummary: string
  ): Promise<number> {
    if (currentId) {
      await this.updateTranscriptOnly(currentId, transcript);
      return currentId;
    } else {
      return await this.createLiveDraft(transcript);
    }
  }

  /**
   * Finaliza ou atualiza o culto com os dados preenchidos no modal pelo usuário.
   * Respeita exatamente o título, preletor, resumo e tags informados.
   */
  static async finalizeLiveDraft(
    id: number,
    title: string,
    preacher: string,
    summary: string,
    tags: string,
    transcript: string
  ): Promise<boolean> {
    return await this.update(id, {
      title: title.trim(),
      preacher: preacher.trim() || 'Pregador',
      summary: summary.trim(),
      tags: tags.trim() || 'Ao Vivo, Transcrito',
      full_transcript: transcript.trim()
    });
  }

  /**
   * Recupera o rascunho de culto de hoje caso o celular tenha reiniciado.
   */
  static async findLatestDraft(): Promise<WorshipService | null> {
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0];
    const row = await db.getFirstAsync<WorshipService>(
      `SELECT * FROM worship_services 
       WHERE (service_date = ? OR service_date = date('now', 'localtime')) 
         AND (tags LIKE '%Rascunho%' OR tags LIKE '%Ao Vivo%') 
       ORDER BY id DESC LIMIT 1;`,
      [today]
    );
    return row || null;
  }
}

