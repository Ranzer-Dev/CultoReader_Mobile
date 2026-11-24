"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = void 0;
const SQLite = require("expo-sqlite");
let databaseInstance = null;
async function getDatabase() {
    if (!databaseInstance) {
        databaseInstance = await SQLite.openDatabaseAsync('culto_compreensao.db');
        // Habilitar chaves estrangeiras e modo WAL para performance
        await databaseInstance.execAsync(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
    `);
    }
    return databaseInstance;
}
exports.getDatabase = getDatabase;
