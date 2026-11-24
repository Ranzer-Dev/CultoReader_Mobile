"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BibleReferenceDetector = exports.registerVerseLookup = void 0;
let defaultVerseLookup = null;
function registerVerseLookup(fn) {
    defaultVerseLookup = fn;
}
exports.registerVerseLookup = registerVerseLookup;
// Mapeamento normalizado de livros da Bíblia em português
const BIBLE_BOOKS = {
    // Pentateuco & Históricos
    'genesis': 'Gênesis', 'gênesis': 'Gênesis', 'gen': 'Gênesis', 'gn': 'Gênesis',
    'exodo': 'Êxodo', 'êxodo': 'Êxodo', 'ex': 'Êxodo',
    'levitico': 'Levítico', 'levítico': 'Levítico', 'lv': 'Levítico',
    'numeros': 'Números', 'números': 'Números', 'nm': 'Números',
    'deuteronomio': 'Deuteronômio', 'deuteronômio': 'Deuteronômio', 'dt': 'Deuteronômio',
    'josue': 'Josué', 'josué': 'Josué', 'js': 'Josué',
    'juizes': 'Juízes', 'juízes': 'Juízes', 'jz': 'Juízes',
    'rute': 'Rute', 'rt': 'Rute',
    '1 samuel': '1 Samuel', 'primeiro samuel': '1 Samuel', '1sm': '1 Samuel',
    '2 samuel': '2 Samuel', 'segundo samuel': '2 Samuel', '2sm': '2 Samuel',
    '1 reis': '1 Reis', 'primeiro reis': '1 Reis', '1rs': '1 Reis',
    '2 reis': '2 Reis', 'segundo reis': '2 Reis', '2rs': '2 Reis',
    '1 cronicas': '1 Crônicas', 'primeiro cronicas': '1 Crônicas', '1cr': '1 Crônicas',
    '2 cronicas': '2 Crônicas', 'segundo cronicas': '2 Crônicas', '2cr': '2 Crônicas',
    'esdras': 'Esdras', 'ed': 'Esdras',
    'neemias': 'Neemias', 'ne': 'Neemias',
    'ester': 'Ester', 'et': 'Ester',
    // Poéticos
    'jo': 'Jó', 'jó': 'Jó',
    'salmos': 'Salmos', 'salmo': 'Salmos', 'sl': 'Salmos',
    'proverbios': 'Provérbios', 'provérbios': 'Provérbios', 'pv': 'Provérbios',
    'eclesiastes': 'Eclesiastes', 'ec': 'Eclesiastes',
    'canticos': 'Cânticos', 'cânticos': 'Cânticos', 'ct': 'Cânticos',
    // Profetas Maiores & Menores
    'isaias': 'Isaías', 'isaías': 'Isaías', 'is': 'Isaías',
    'jeremias': 'Jeremias', 'jr': 'Jeremias',
    'lamentacoes': 'Lamentações', 'lamentações': 'Lamentações', 'lm': 'Lamentações',
    'ezequiel': 'Ezequiel', 'ez': 'Ezequiel',
    'daniel': 'Daniel', 'dn': 'Daniel',
    'oseias': 'Oséias', 'oséias': 'Oséias', 'os': 'Oséias',
    'joel': 'Joel', 'jl': 'Joel',
    'amos': 'Amós', 'amós': 'Amós', 'am': 'Amós',
    'obadias': 'Obadias', 'ob': 'Obadias',
    'jonas': 'Jonas', 'jn': 'Jonas',
    'miqueias': 'Miquéias', 'miquéias': 'Miquéias', 'mq': 'Miquéias',
    'naum': 'Naum', 'na': 'Naum',
    'habacuque': 'Habacuque', 'hc': 'Habacuque',
    'sofonias': 'Sofonias', 'sf': 'Sofonias',
    'ageu': 'Ageu', 'ag': 'Ageu',
    'zacarias': 'Zacarias', 'zc': 'Zacarias',
    'malaquias': 'Malaquias', 'ml': 'Malaquias',
    // Evangelhos & Atos
    'mateus': 'Mateus', 'mt': 'Mateus',
    'marcos': 'Marcos', 'mc': 'Marcos',
    'lucas': 'Lucas', 'lc': 'Lucas',
    'joao': 'João', 'joão': 'João',
    'atos': 'Atos', 'at': 'Atos',
    // Epístolas Paulinas & Gerais
    'romanos': 'Romanos', 'rm': 'Romanos',
    '1 corintios': '1 Coríntios', '1 coríntios': '1 Coríntios', 'primeiro corintios': '1 Coríntios', '1co': '1 Coríntios',
    '2 corintios': '2 Coríntios', '2 coríntios': '2 Coríntios', 'segundo corintios': '2 Coríntios', '2co': '2 Coríntios',
    'galatas': 'Gálatas', 'gálatas': 'Gálatas', 'gl': 'Gálatas',
    'efesios': 'Efésios', 'efésios': 'Efésios', 'ef': 'Efésios',
    'filipenses': 'Filipenses', 'fp': 'Filipenses',
    'colossenses': 'Colossenses', 'cl': 'Colossenses',
    '1 tessalonicenses': '1 Tessalonicenses', '1ts': '1 Tessalonicenses',
    '2 tessalonicenses': '2 Tessalonicenses', '2ts': '2 Tessalonicenses',
    '1 timoteo': '1 Timóteo', '1 timóteo': '1 Timóteo', '1tm': '1 Timóteo',
    '2 timoteo': '2 Timóteo', '2 timóteo': '2 Timóteo', '2tm': '2 Timóteo',
    'tito': 'Tito', 'tt': 'Tito',
    'filemom': 'Filemom', 'fm': 'Filemom',
    'hebreus': 'Hebreus', 'hb': 'Hebreus',
    'tiago': 'Tiago', 'tg': 'Tiago',
    '1 pedro': '1 Pedro', 'primeiro pedro': '1 Pedro', '1pe': '1 Pedro',
    '2 pedro': '2 Pedro', 'segundo pedro': '2 Pedro', '2pe': '2 Pedro',
    '1 joao': '1 João', '1 joão': '1 João', 'primeiro joao': '1 João', '1jo': '1 João',
    '2 joao': '2 João', '2 joão': '2 João', 'segundo joao': '2 João', '2jo': '2 João',
    '3 joao': '3 João', '3 joão': '3 João', 'terceiro joao': '3 João', '3jo': '3 João',
    'judas': 'Judas', 'jd': 'Judas',
    'apocalipse': 'Apocalipse', 'ap': 'Apocalipse'
};
function normalizeString(str) {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}
class BibleReferenceDetector {
    /**
     * Analisa um texto e detecta todas as referências bíblicas faladas ou escritas.
     * Exemplos:
     * - "João 3:16"
     * - "Romanos capítulo 8 versículo 28"
     * - "Hebreus 11 versículo 1"
     * - "Salmos 23:1"
     */
    static async detectReferences(text, versionCode = 'ARA', verseLookup) {
        if (!text || text.trim().length === 0)
            return [];
        const detected = [];
        const escapeRegex = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const booksKeys = Object.keys(BIBLE_BOOKS).sort((a, b) => b.length - a.length);
        const booksPattern = booksKeys.map(k => escapeRegex(k).replace(/\s+/g, '\\s+')).join('|');
        // Expressões Regulares para capturar formatos numéricos e falados
        const regexList = [
            // Padrão 1: "João 3:16" ou "1 Coríntios 5:17" ou "João 3:16-18"
            new RegExp(`(?:^|\\s)(${booksPattern})\\s+(\\d{1,3}):(\\d{1,3})(?:-(\\d{1,3}))?(?:$|[\\s.,;!?])`, 'gi'),
            // Padrão 2: "Romanos capítulo 8 versículo 28" ou "Gênesis cap 1 ver 3"
            new RegExp(`(?:^|\\s)(${booksPattern})\\s+(?:cap[ií]tulo|cap\\.?)\\s*(\\d{1,3})\\s+(?:vers[ií]culo|vers\\.?|v\\.?)\\s*(\\d{1,3})(?:\\s*(?:ao|a|-)\\s*(\\d{1,3}))?(?:$|[\\s.,;!?])`, 'gi'),
            // Padrão 3: "Hebreus 11 versículo 1" ou "Salmos 23 versículo 1"
            new RegExp(`(?:^|\\s)(${booksPattern})\\s+(\\d{1,3})\\s+(?:vers[ií]culo|vers\\.?|v\\.?)\\s*(\\d{1,3})(?:\\s*(?:ao|a|-)\\s*(\\d{1,3}))?(?:$|[\\s.,;!?])`, 'gi')
        ];
        for (const regex of regexList) {
            let match;
            while ((match = regex.exec(text)) !== null) {
                const rawBook = normalizeString(match[1]);
                const canonicalBook = BIBLE_BOOKS[rawBook] || match[1];
                const chapter = parseInt(match[2], 10);
                const verseStart = parseInt(match[3], 10);
                const verseEnd = match[4] ? parseInt(match[4], 10) : undefined;
                // Evitar duplicatas já detectadas no mesmo trecho
                const isAlreadyAdded = detected.some(d => d.book === canonicalBook && d.chapter === chapter && d.verse_start === verseStart);
                if (!isAlreadyAdded && chapter > 0 && verseStart > 0) {
                    // Buscar texto bíblico
                    let fullText;
                    const lookup = verseLookup || defaultVerseLookup;
                    if (lookup) {
                        try {
                            fullText = await lookup(canonicalBook, chapter, verseStart, verseEnd, versionCode);
                        }
                        catch {
                            // Prossegue se o lookup falhar
                        }
                    }
                    detected.push({
                        book: canonicalBook,
                        chapter,
                        verse_start: verseStart,
                        verse_end: verseEnd,
                        full_text: fullText,
                        version_code: versionCode
                    });
                }
            }
        }
        return detected;
    }
}
exports.BibleReferenceDetector = BibleReferenceDetector;
