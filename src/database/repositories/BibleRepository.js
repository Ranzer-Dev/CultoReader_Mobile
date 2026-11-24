"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BibleRepository = void 0;
const connection_1 = require("../connection");
class BibleRepository {
    static async findVerse(book, chapter, verse, versionCode = 'ARA') {
        const db = await (0, connection_1.getDatabase)();
        const row = await db.getFirstAsync(`SELECT * FROM bible_verses 
       WHERE version_code = ? AND LOWER(book) = LOWER(?) AND chapter = ? AND verse = ?;`, [versionCode, book.trim(), chapter, verse]);
        return row || null;
    }
    static async findVersesRange(book, chapter, startVerse, endVerse, versionCode = 'ARA') {
        const db = await (0, connection_1.getDatabase)();
        const rows = await db.getAllAsync(`SELECT * FROM bible_verses 
       WHERE version_code = ? AND LOWER(book) = LOWER(?) AND chapter = ? AND verse >= ? AND verse <= ?
       ORDER BY verse ASC;`, [versionCode, book.trim(), chapter, startVerse, endVerse]);
        return rows;
    }
    static async listVersions() {
        const db = await (0, connection_1.getDatabase)();
        const rows = await db.getAllAsync(`SELECT * FROM bible_versions ORDER BY is_default DESC, name ASC;`);
        return rows;
    }
    static async searchByText(query, versionCode = 'ARA', limit = 20) {
        const db = await (0, connection_1.getDatabase)();
        const term = `%${query.trim()}%`;
        const rows = await db.getAllAsync(`SELECT * FROM bible_verses 
       WHERE version_code = ? AND text LIKE ?
       LIMIT ?;`, [versionCode, term, limit]);
        return rows;
    }
}
exports.BibleRepository = BibleRepository;
