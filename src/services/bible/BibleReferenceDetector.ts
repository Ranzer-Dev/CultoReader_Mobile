import { DetectedVerse } from '../../types';
import { BibleRepository } from '../../database/repositories/BibleRepository';
import { BibleManager } from './BibleManager';
import { sanitizeSpeechChunk } from '../../utils/speechSanitizer';

export type VerseLookupFunction = (
  book: string,
  chapter: number,
  start: number,
  end?: number,
  versionCode?: string
) => Promise<string | undefined>;

let defaultVerseLookup: VerseLookupFunction | null = null;

export function registerVerseLookup(fn: VerseLookupFunction): void {
  defaultVerseLookup = fn;
}

// Mapeamento normalizado de livros da Bíblia em português
const BIBLE_BOOKS: Record<string, string> = {
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
  'salmos': 'Salmos', 'salmo': 'Salmos', 'sl': 'Salmos', 'samo': 'Salmos', 'samos': 'Salmos',
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
  'atos': 'Atos', 'atos dos apostolos': 'Atos', 'atos dos apóstolos': 'Atos', 'at': 'Atos',
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
  'apocalipse': 'Apocalipse', 'ap': 'Apocalipse',
  // Multilíngue (Inglês, Espanhol, Francês, Suaíli, Changana)
  'exodus': 'Êxodo', 'leviticus': 'Levítico', 'numbers': 'Números', 'deuteronomy': 'Deuteronômio',
  'joshua': 'Josué', 'judges': 'Juízes', 'ruth': 'Rute', '1 kings': '1 Reis', '2 kings': '2 Reis',
  '1 chronicles': '1 Crônicas', '2 chronicles': '2 Crônicas', 'ezra': 'Esdras', 'nehemiah': 'Neemias', 'esther': 'Ester',
  'psalms': 'Salmos', 'psalm': 'Salmos', 'ps': 'Salmos', 'proverbs': 'Provérbios', 'pr': 'Provérbios',
  'song of solomon': 'Cânticos', 'isaiah': 'Isaías', 'jeremiah': 'Jeremias', 'lamentations': 'Lamentações',
  'ezekiel': 'Ezequiel', 'hosea': 'Oséias', 'obadiah': 'Obadias', 'jonah': 'Jonas', 'micah': 'Miquéias',
  'nahum': 'Naum', 'habakkuk': 'Habacuque', 'zephaniah': 'Sofonias', 'haggai': 'Ageu', 'zechariah': 'Zacarias', 'malachi': 'Malaquias',
  'matthew': 'Mateus', 'mark': 'Marcos', 'luke': 'Lucas', 'john': 'João', 'acts': 'Atos',
  'romans': 'Romanos', '1 corinthians': '1 Coríntios', '2 corinthians': '2 Coríntios', 'galatians': 'Gálatas',
  'ephesians': 'Efésios', 'philippians': 'Filipenses', 'colossians': 'Colossenses',
  '1 thessalonians': '1 Tessalonicenses', '2 thessalonians': '2 Tessalonicenses',
  '1 timothy': '1 Timóteo', '2 timothy': '2 Timóteo', 'titus': 'Tito', 'philemon': 'Filemom',
  'hebrews': 'Hebreus', 'james': 'Tiago', '1 peter': '1 Pedro', '2 peter': '2 Pedro',
  '1 john': '1 João', '2 john': '2 João', '3 john': '3 João', 'jude': 'Judas', 'revelation': 'Apocalipse',
  // Espanhol
  'san mateo': 'Mateus', 'san marcos': 'Marcos', 'san lucas': 'Lucas', 'san juan': 'João', 'juan': 'João',
  'hechos': 'Atos', 'santiago': 'Tiago', 'apocalipsis': 'Apocalipse',
  // Francês
  'genese': 'Gênesis', 'exode': 'Êxodo', 'levitique': 'Levítico', 'nombres': 'Números', 'deuteronome': 'Deuteronômio',
  'juges': 'Juízes', '1 rois': '1 Reis', '2 rois': '2 Reis', 'psaumes': 'Salmos', 'psaume': 'Salmos',
  'proverbes': 'Provérbios', 'matthieu': 'Mateus', 'marc': 'Marcos', 'luc': 'Lucas', 'jean': 'João',
  'romains': 'Romanos', 'jacques': 'Tiago', 'apocalypse': 'Apocalipse',
  // Suaíli
  'mwanzo': 'Gênesis', 'kutoka': 'Êxodo', 'walawi': 'Levítico', 'hesabu': 'Números', 'kumbukumbu': 'Deuteronômio',
  'yoshua': 'Josué', 'waamuzi': 'Juízes', 'ruthi': 'Rute', '1 samweli': '1 Samuel', '2 samweli': '2 Samuel',
  '1 wafalme': '1 Reis', '2 wafalme': '2 Reis', 'zaburi': 'Salmos', 'mithali': 'Provérbios', 'mhubiri': 'Eclesiastes',
  'isaya': 'Isaías', 'yeremia': 'Jeremias', 'mathayo': 'Mateus', 'marko': 'Marcos', 'luka': 'Lucas',
  'yohana': 'João', 'matendo': 'Atos', 'warumi': 'Romanos', 'ufunuo': 'Apocalipse',
  // Changana / Xitsonga
  'genesi': 'Gênesis', 'eksoda': 'Êxodo', 'levhitika': 'Levítico', 'tinhlayo': 'Números', 'deteronoma': 'Deuteronômio',
  'yoxuwa': 'Josué', 'vaavanyisi': 'Juízes', 'rhuti': 'Rute', 'tinsimu': 'Salmos', 'swivuriso': 'Provérbios',
  'esaya': 'Isaías', 'yeremiya': 'Jeremias', 'matewu': 'Mateus', 'marka': 'Marcos', 'yohane': 'João',
  'mitirho': 'Atos', 'varhoma': 'Romanos', 'nhlavutelo': 'Apocalipse'
};

const WORD_NUMS: Record<string, number> = {
  'um': 1, 'uma': 1, 'primeiro': 1, 'primeira': 1, '1º': 1, '1ª': 1,
  'dois': 2, 'duas': 2, 'segundo': 2, 'segunda': 2, '2º': 2, '2ª': 2,
  'tres': 3, 'três': 3, 'terceiro': 3, 'terceira': 3, '3º': 3, '3ª': 3,
  'quatro': 4, 'quarto': 4, 'quarta': 4, '4º': 4,
  'cinco': 5, 'quinto': 5, 'quinta': 5, '5º': 5,
  'seis': 6, 'sexto': 6, 'sexta': 6, '6º': 6,
  'sete': 7, 'setimo': 7, 'sétimo': 7, 'sétima': 7, '7º': 7,
  'oito': 8, 'oitavo': 8, 'oitava': 8, '8º': 8,
  'nove': 9, 'nono': 9, 'nona': 9, '9º': 9,
  'dez': 10, 'decimo': 10, 'décimo': 10, 'décima': 10, '10º': 10,
  'onze': 11, 'doze': 12, 'treze': 13, 'quatorze': 14, 'catorze': 14,
  'quinze': 15, 'dezesseis': 16, 'dezessete': 17, 'dezoito': 18, 'dezenove': 19,
  'vinte': 20, 'trinta': 30, 'quarenta': 40, 'cinquenta': 50,
  'sessenta': 60, 'setenta': 70, 'oitenta': 80, 'noventa': 90, 'cem': 100
};

export function normalizeSpokenNumbers(text: string): string {
  let t = text;

  // Centenas compostas: "cento e dezenove" -> 119, "cento e cinquenta" -> 150
  t = t.replace(/\bcento\s+e\s+(vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa)\s+e\s+(um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove)\b/gi, (match, d, u) => {
    return String(100 + (WORD_NUMS[d.toLowerCase()] || 0) + (WORD_NUMS[u.toLowerCase()] || 0));
  });
  t = t.replace(/\bcento\s+e\s+(um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa)\b/gi, (match, u) => {
    return String(100 + (WORD_NUMS[u.toLowerCase()] || 0));
  });

  // Dezenas compostas: 'vinte e três' -> 23
  t = t.replace(/\b(vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa)\s+e\s+(um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove)\b/gi, (match, d, u) => {
    const val = (WORD_NUMS[d.toLowerCase()] || 0) + (WORD_NUMS[u.toLowerCase()] || 0);
    return String(val);
  });

  // Números simples por extenso
  t = t.replace(/\b(um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|primeiro|segundo|terceiro|quarto|quinto|sexto|sétimo|setimo|oitavo|nono|décimo|decimo)\b/gi, (match, w) => {
    const val = WORD_NUMS[w.toLowerCase()];
    return val !== undefined ? String(val) : match;
  });

  return t;
}

const NUMBER_REGEX_MAP: Record<number, string> = {
  1: '1|um|uma|primeiro|primeira|1º|1ª',
  2: '2|dois|duas|segundo|segunda|2º|2ª',
  3: '3|tr[eê]s|terceiro|terceira|3º|3ª',
  4: '4|quatro|quarto|quarta|4º',
  5: '5|cinco|quinto|quinta|5º',
  6: '6|seis|sexto|sexta|6º',
  7: '7|sete|s[eé]timo|s[eé]tima|7º',
  8: '8|oito|oitavo|oitava|8º',
  9: '9|nove|nono|nona|9º',
  10: '10|dez|d[eé]cimo',
  11: '11|onze',
  12: '12|doze',
  13: '13|treze',
  14: '14|quatorze|catorze',
  15: '15|quinze',
  16: '16|dezesseis',
  17: '17|dezessete',
  18: '18|dezoito',
  19: '19|dezenove',
  20: '20|vinte',
  23: '23|vinte\\s+e\\s+tr[eê]s',
  28: '28|vinte\\s+e\\s+oito',
  30: '30|trinta',
  91: '91|noventa\\s+e\\s+um',
  119: '119|cento\\s+e\\s+dezenove'
};

function numPattern(n: number): string {
  return '(?:' + (NUMBER_REGEX_MAP[n] || String(n)) + ')';
}

function accentInsensitiveBookPattern(book: string): string {
  const norm = book.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const escaped = norm.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  return escaped
    .replace(/a/g, '[aáàâãä]')
    .replace(/e/g, '[eéèêë]')
    .replace(/i/g, '[iíìîï]')
    .replace(/o/g, '[oóòôõö]')
    .replace(/u/g, '[uúùûü]')
    .replace(/c/g, '[cç]')
    .replace(/n/g, '[nñ]')
    .replace(/\s+/g, '\\s+');
}

/**
 * Cria expressão regular flexível para encontrar no texto qualquer citação ao versículo,
 * suportando acentos multilíngues, números em dígitos ou por extenso, pontuações e expressões de púlpito.
 */
export function buildVerseRegex(book: string, chapter: number, verseStart?: number, verseEnd?: number): RegExp {
  const normBook = accentInsensitiveBookPattern(book);
  const prefix = '(?:(?:no|do|da|em|o|a|in|on|the|en|dans)\\s+)?(?:(?:livro|book|libro|livre)\\s+(?:(?:de|of|du)\\s+)?)?';
  const capWord = '(?:(?:no|do|em|in|en|dans)\\s+)?(?:cap[ií]tulo|chapter|chapitre|sura|kavanyisa|cap\\.?|ch\\.?|c\\.?\\s*)';
  const verWord = '(?:vers[ií]culos?|verses?|versets?|versos?|mistari|mstari|ndzimana|vers?\\.?|vv?\\.?)';
  const cPat = numPattern(chapter);
  const v1Pat = verseStart ? numPattern(verseStart) : null;
  const v2Pat = verseEnd ? numPattern(verseEnd) : null;

  const patterns: string[] = [];

  if (v1Pat) {
    const rangeEnd = v2Pat
      ? '(?:\\s*(?:ao|a|e|ate|até|al|to|through|-)\\s*(?:(?:o|a|the)\\s+)?(?:' + verWord + ')?\\s*' + v2Pat + ')'
      : '';
    const optRangeEnd = v2Pat ? rangeEnd + '?' : '';

    // 1. "Salmos 3:4" ou "Salmos 3:4-8" ou "Salmos 3:4 ao 8"
    patterns.push(normBook + '[,;]?\\s+' + cPat + '[:\\s]+' + v1Pat + (v2Pat ? rangeEnd : ''));

    // 2. "Salmos capítulo 3 versículo 4" / "Isaías no capítulo 40 versículo 31" / "Livro de Salmos capítulo 4 do versículo 8 ao 9"
    patterns.push(
      prefix + normBook + '[,;]?\\s*(?:' + capWord + ')?\\s*' + cPat +
      '[,;]?\\s*(?:(?:no|do|da|nos|nas|o|a|del|of)\\s+)?' + verWord + '\\s*' + v1Pat + optRangeEnd
    );

    // 3. "salmos 30 do 2 ao 4" / "salmos 30 de 2 a 4"
    if (v2Pat) {
      patterns.push(
        prefix + normBook + '[,;]?\\s*(?:' + capWord + ')?\\s*' + cPat +
        '\\s+(?:do|da|de|no|na|del|from)\\s+' + v1Pat + '\\s*(?:ao|a|ate|até|al|to|-)\\s*(?:(?:o|a|the)\\s+)?' + v2Pat
      );
    }

    // 4. "salmos versículo 2 no capítulo 3"
    patterns.push(
      prefix + normBook + '[,;]?\\s*(?:(?:no|do|da|nos|nas|o|a)\\s+)?' + verWord + '\\s*' +
      v1Pat + optRangeEnd + '\\s+(?:no|do|da|em|de|in|of)?\\s*' + capWord + '\\s*' + cPat
    );

    // 5. Invertido: "versículo 2 do capítulo 3 de Salmos"
    patterns.push(
      '(?:(?:no|do|da|nos|nas|o|a)\\s+)?' + verWord + '\\s*' +
      v1Pat + optRangeEnd + '\\s+(?:do|no|da|em|de|of|in)\\s+' + capWord + '\\s*' + cPat +
      '\\s+(?:de|do|da|em|of|in)\\s+(?:(?:livro|book)\\s+(?:(?:de|of)\\s+)?)?' + normBook
    );
  } else {
    // Capítulo isolado (Salmo 23)
    patterns.push(prefix + normBook + '[,;]?\\s*(?:cap[ií]tulo|cap\\.?|c\\.?\\s*)?\\s*' + cPat);
  }

  return new RegExp('(?:' + patterns.join('|') + ')', 'gi');
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export class BibleReferenceDetector {
  /**
   * Analisa um texto e detecta todas as referências bíblicas faladas ou escritas.
   * Suporta formatos pontuados, com vírgulas e todas as expressões de púlpito como:
   * - "Salmos capítulo 3 versículo 4"
   * - "Livro de Salmos capítulo 4 do versículo 8 ao versículo 9"
   * - "salmos 30 do 2 ao 4"
   * - "salmos versiculo 2 no capitulo 3"
   * - "versículo 4 do salmo 3"
   * - "João 3:16" ou "Filipenses 4:8-9"
   * - "Salmo 23" / "Salmo 91" (capítulo inteiro somente quando nenhum versículo for citado)
   */
  static async detectReferences(
    text: string,
    versionCode?: string,
    verseLookup?: (book: string, chapter: number, start: number, end?: number) => Promise<string | undefined>,
    targetLang?: string
  ): Promise<DetectedVerse[]> {
    if (!text || text.trim().length === 0) return [];

    const activeVersion = versionCode || (targetLang ? BibleManager.getVersionForLanguage(targetLang) : 'NVI');
    const detected: DetectedVerse[] = [];
    const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const booksKeys = Object.keys(BIBLE_BOOKS).sort((a, b) => b.length - a.length);
    const booksPattern = booksKeys.map(k => escapeRegex(k).replace(/\s+/g, '\\s+')).join('|');

    // 1. Padrão numérico clássico: "João 3:16", "Filipenses 4:8-9", "Salmos 3:2 ao 4"
    const regex1 = new RegExp(
      `(?:^|[\\s.,;!?])(${booksPattern})[,;]?\\s+(\\d{1,3}):(\\d{1,3})(?:\\s*(?:-|a|ao|ate|até|e)\\s*(?:(?:o|a)\\s+)?(?:vers[ií]culos?|versos?|vers?\\.?)?\\s*(\\d{1,3}))?(?:$|[\\s.,;!?])`,
      'gi'
    );

    // 2. Padrão falado completo do pregador:
    // "no livro de Filipenses, capítulo 4, versículos 8 ao 9", "Isaías no capítulo 40 versículo 31",
    // "Salmos 3 versículo 4", "Salmos cap. 3 v. 4 a 6"
    const regex2 = new RegExp(
      `(?:^|[\\s.,;!?])(?:(?:no|do|da|em|o|a|in|en|dans)\\s+)?(?:(?:livro|book|libro|livre)\\s+(?:(?:de|of|du)\\s+)?)?(${booksPattern})[,;]?\\s*(?:(?:no|do|em|in|en|dans)\\s+)?(?:cap[ií]tulo|chapter|chapitre|sura|kavanyisa|cap\\.?|ch\\.?|c\\.?\\s*)?\\s*(\\d{1,3})[,;]?\\s*(?:(?:no|do|da|nos|nas|o|a|del|of)\\s+)?(?:vers[ií]culos?|verses?|versets?|versos?|mistari|mstari|ndzimana|vers?\\.?|vv?\\.?)\\s*(\\d{1,3})(?:\\s*(?:ao|a|e|ate|até|al|to|-)\\s*(?:(?:o|a|the)\\s+)?(?:vers[ií]culos?|verses?|versets?|versos?|vers?\\.?|vv?\\.?)?\\s*(\\d{1,3}))?(?:$|[\\s.,;!?])`,
      'gi'
    );

    // 3. Padrão de intervalo direto sem a palavra "versículo":
    // "salmos 30 do 2 ao 4", "salmos capítulo 30 do 2 ao 4", "salmos 30 do 2 até o 4", "salmos 30 de 2 a 4"
    const regex3 = new RegExp(
      `(?:^|[\\s.,;!?])(?:(?:no|do|da|em|o|a)\\s+)?(?:livro\\s+(?:de\\s+)?)?(${booksPattern})[,;]?\\s*(?:cap[ií]tulo|cap\\.?|c\\.?\\s*)?\\s*(\\d{1,3})\\s+(?:do|da|de|no|na)\\s+(\\d{1,3})\\s*(?:ao|a|ate|até|-)\\s*(?:(?:o|a)\\s+)?(\\d{1,3})(?:$|[\\s.,;!?])`,
      'gi'
    );

    // 4. Padrão com versículo antes do capítulo:
    // "salmos versiculo 2 no capitulo 3", "salmos versículos 2 ao 4 no capítulo 3", "salmos do versículo 2 ao 4 do capítulo 3"
    const regex4 = new RegExp(
      `(?:^|[\\s.,;!?])(?:(?:no|do|da|em|o|a)\\s+)?(?:livro\\s+(?:de\\s+)?)?(${booksPattern})[,;]?\\s*(?:(?:no|do|da|nos|nas|o|a)\\s+)?(?:vers[ií]culos?|versos?|vers?\\.?|vv?\\.?)\\s*(\\d{1,3})(?:\\s*(?:ao|a|e|ate|até|-)\\s*(?:(?:o|a)\\s+)?(?:vers[ií]culos?|versos?|vers?\\.?|vv?\\.?)?\\s*(\\d{1,3}))?\\s+(?:no|do|da|em|de)?\\s*(?:cap[ií]tulo|cap\\.?|c\\.?\\s*)\\s*(\\d{1,3})(?:$|[\\s.,;!?])`,
      'gi'
    );

    // 5. Padrão invertido:
    // "versículo 2 do capítulo 3 de Salmos", "versículos 8 ao 9 do capítulo 4 de Filipenses", "versículo 4 do salmo 3"
    const regex5 = new RegExp(
      `(?:^|[\\s.,;!?])(?:(?:no|do|da|nos|nas|o|a)\\s+)?(?:vers[ií]culos?|versos?|vers?\\.?|vv?\\.?)\\s*(\\d{1,3})(?:\\s*(?:ao|a|e|ate|até|-)\\s*(?:(?:o|a)\\s+)?(?:vers[ií]culos?|versos?|vers?\\.?|vv?\\.?)?\\s*(\\d{1,3}))?\\s+(?:(?:do|no|da|em|de)\\s+(?:cap[ií]tulo|cap\\.?)\\s*(\\d{1,3})\\s+(?:de|do|da|em)\\s+(?:livro\\s+(?:de\\s+)?)?(${booksPattern})|(?:de|do|da|em)\\s+(?:livro\\s+(?:de\\s+)?)?(${booksPattern})[,;]?\\s*(?:(?:cap[ií]tulo|cap\\.?)\\s*)?(\\d{1,3})?)(?:$|[\\s.,;!?])`,
      'gi'
    );

    // 6. Padrão de capítulo isolado (ex: "Salmo 23", "Salmo 91", "Gênesis capítulo 1")
    // IMPORTANTE: Negative lookahead estrito impede casar precocemente quando o pregador estiver prestes a falar versículo!
    const regex6 = new RegExp(
      `(?:^|[\\s.,;!?])(?:(?:no|do|da|em|o|a)\\s+)?(?:livro\\s+(?:de\\s+)?)?(${booksPattern})[,;]?\\s+(?:cap[ií]tulo|cap\\.?|c\\.?\\s*)?\\s*(\\d{1,3})(?![\\s,;:]*(?:vers[ií]culos?|versos?|vers?\\b|vv?\\b|do\\s+vers[ií]culo|do\\s+\\d+|da\\s+\\d+|de\\s+\\d+|no\\s+vers[ií]culo|no\\s+\\d+|na\\s+\\d+|ao\\s|a\\s+\\d+|ate\\s|até\\s|:\\s*\\d+|\\d+))(?:$|[\\s.,;!?])`,
      'gi'
    );

    const extractMatch = async (
      canonicalBook: string,
      chapter: number,
      verseStart: number,
      verseEnd: number | undefined,
      rawMatch: string,
      isChapterOnly: boolean = false
    ) => {
      const cleanRawMatch = rawMatch.replace(/^[.,;!?\s]+|[.,;!?\s]+$/g, '').trim();

      // Se este match é apenas de capítulo (sem versículo específico),
      // e já temos um match com versículo específico para este livro e capítulo, IGNORA!
      if (isChapterOnly) {
        const hasSpecific = detected.some(
          d => d.book === canonicalBook && d.chapter === chapter && !d.is_chapter_only
        );
        if (hasSpecific) return;
      }

      // Se este match TEM versículo específico,
      // e havia um match anterior marcado apenas como capítulo para este mesmo livro e capítulo,
      // REMOVE o match genérico de capítulo para substituí-lo pelo versículo exato do pastor!
      if (!isChapterOnly) {
        const genIdx = detected.findIndex(
          d => d.book === canonicalBook && d.chapter === chapter && d.is_chapter_only
        );
        if (genIdx !== -1) {
          detected.splice(genIdx, 1);
        }
      }

      // Evita duplicar exatamente a mesma referência
      const isDuplicate = detected.some(
        d => d.book === canonicalBook &&
             d.chapter === chapter &&
             d.verse_start === verseStart &&
             d.verse_end === verseEnd
      );
      if (isDuplicate) return;

      if (chapter > 0 && verseStart > 0) {
        let fullText: string | undefined;

        // 1. Tenta carregar do BibleManager (KJV para inglês, RVR para espanhol, NVI para português)
        try {
          if (verseEnd && verseEnd > verseStart) {
            fullText = (await BibleManager.getVersesRangeText(activeVersion, canonicalBook, chapter, verseStart, verseEnd, targetLang)) || undefined;
          } else {
            fullText = (await BibleManager.getVerseText(activeVersion, canonicalBook, chapter, verseStart, targetLang)) || undefined;
          }
        } catch {}

        // 2. Se não encontrou, tenta lookup legado no SQLite
        if (!fullText) {
          const lookup = verseLookup || defaultVerseLookup;
          if (lookup) {
            try {
              fullText = await lookup(canonicalBook, chapter, verseStart, verseEnd, activeVersion);
            } catch {}
          } else {
            try {
              if (verseEnd && verseEnd > verseStart) {
                const verses = await BibleRepository.findVersesRange(canonicalBook, chapter, verseStart, verseEnd, activeVersion);
                if (verses.length > 0) {
                  fullText = verses.map(v => `${v.verse}. ${v.text}`).join(' ');
                }
              } else {
                const verse = await BibleRepository.findVerse(canonicalBook, chapter, verseStart, activeVersion);
                if (verse) {
                  fullText = verse.text;
                }
              }
            } catch {}
          }
        }

        // 3. Traduz o nome do livro para o idioma ativo (ex: "Psalms" se estiver em inglês)
        const bookInfo = BibleManager.findBookInfo(canonicalBook);
        const displayBook = (bookInfo && targetLang)
          ? BibleManager.getBookDisplayName(bookInfo, targetLang)
          : canonicalBook;

        detected.push({
          book: displayBook,
          chapter,
          verse_start: verseStart,
          verse_end: verseEnd,
          full_text: fullText,
          version_code: activeVersion,
          raw_match: cleanRawMatch,
          is_chapter_only: isChapterOnly
        });
      }
    };

    const runScan = async (targetText: string) => {
      let match: RegExpExecArray | null;

      // Padrão 1: "João 3:16"
      regex1.lastIndex = 0;
      while ((match = regex1.exec(targetText)) !== null) {
        const canonicalBook = BIBLE_BOOKS[normalizeString(match[1])] || match[1];
        const chapter = parseInt(match[2], 10);
        const verseStart = parseInt(match[3], 10);
        const verseEnd = match[4] ? parseInt(match[4], 10) : undefined;
        await extractMatch(canonicalBook, chapter, verseStart, verseEnd, match[0], false);
      }

      // Padrão 2: "Filipenses capítulo 4 do versículo 8 ao versículo 9"
      regex2.lastIndex = 0;
      while ((match = regex2.exec(targetText)) !== null) {
        const canonicalBook = BIBLE_BOOKS[normalizeString(match[1])] || match[1];
        const chapter = parseInt(match[2], 10);
        const verseStart = parseInt(match[3], 10);
        const verseEnd = match[4] ? parseInt(match[4], 10) : undefined;
        await extractMatch(canonicalBook, chapter, verseStart, verseEnd, match[0], false);
      }

      // Padrão 3: "salmos 30 do 2 ao 4"
      regex3.lastIndex = 0;
      while ((match = regex3.exec(targetText)) !== null) {
        const canonicalBook = BIBLE_BOOKS[normalizeString(match[1])] || match[1];
        const chapter = parseInt(match[2], 10);
        const verseStart = parseInt(match[3], 10);
        const verseEnd = parseInt(match[4], 10);
        await extractMatch(canonicalBook, chapter, verseStart, verseEnd, match[0], false);
      }

      // Padrão 4: "salmos versiculo 2 no capitulo 3"
      regex4.lastIndex = 0;
      while ((match = regex4.exec(targetText)) !== null) {
        const canonicalBook = BIBLE_BOOKS[normalizeString(match[1])] || match[1];
        const verseStart = parseInt(match[2], 10);
        const verseEnd = match[3] ? parseInt(match[3], 10) : undefined;
        const chapter = parseInt(match[4], 10);
        await extractMatch(canonicalBook, chapter, verseStart, verseEnd, match[0], false);
      }

      // Padrão 5: "versículo 2 do capítulo 3 de Salmos" ou "versículo 4 do salmo 3"
      regex5.lastIndex = 0;
      while ((match = regex5.exec(targetText)) !== null) {
        const verseStart = parseInt(match[1], 10);
        const verseEnd = match[2] ? parseInt(match[2], 10) : undefined;
        const chapterFromVar1 = match[3] ? parseInt(match[3], 10) : undefined;
        const bookFromVar1 = match[4];
        const bookFromVar2 = match[5];
        const chapterFromVar2 = match[6] ? parseInt(match[6], 10) : undefined;

        const rawBook = bookFromVar1 || bookFromVar2;
        const chapter = chapterFromVar1 || chapterFromVar2 || 1;
        if (rawBook) {
          const canonicalBook = BIBLE_BOOKS[normalizeString(rawBook)] || rawBook;
          await extractMatch(canonicalBook, chapter, verseStart, verseEnd, match[0], false);
        }
      }

      // Padrão 6: Capítulo isolado "Salmo 23" / "Salmo 91"
      regex6.lastIndex = 0;
      while ((match = regex6.exec(targetText)) !== null) {
        const canonicalBook = BIBLE_BOOKS[normalizeString(match[1])] || match[1];
        const chapter = parseInt(match[2], 10);
        await extractMatch(canonicalBook, chapter, 1, undefined, match[0], true);
      }

      // Padrão 7: Conversacional de Púlpito com pausas, hesitações e palavras intercaladas
      // Ex.: "Livro Salmos é qual era mesmo o capitulo? a lembrei era 3, versiculo 4"
      // "No livro de Salmos... o capítulo é 37 e o versículo vai do 16 ao 20"
      // IMPORTANTE: Nunca atravessa outro livro bíblico nem sentenças completamente diferentes!
      const convBookRegex = new RegExp(
        `(?:^|[\\s.,;!?])(?:(?:no|do|da|em|o|a|in|on|the)\\s+)?(?:(?:livro|book)\\s+(?:de|of\\s+)?)?(${booksPattern})(?:$|[\\s.,;!?])`,
        'gi'
      );
      const nextBookBoundaryRegex = new RegExp(`(?:^|[\\s.,;!?])(${booksPattern})(?:$|[\\s.,;!?])`, 'i');
      // Quebra de frase comum: ponto/exclamação/interrogação NÃO seguido de continuação de citação bíblica
      const sentenceBreakRegex = /[.!?]+\s+(?!(?:a\s+|ah\s+|é\s+|e\s+)?(?:lembrei|cap[ií]tulo|cap\.?|vers[ií]culos?|versos?|vers?\.?|vv?\.?|qual\s+(?:era|e|é)|remembered|chapter|verses?|ch\.?)\b)/i;
      let bookMatch: RegExpExecArray | null;

      while ((bookMatch = convBookRegex.exec(targetText)) !== null) {
        const rawBook = bookMatch[1];
        const canonicalBook = BIBLE_BOOKS[normalizeString(rawBook)] || rawBook;
        const startIndex = bookMatch.index;
        const afterBookPos = startIndex + bookMatch[0].length;

        // Janela conversacional de até 140 caracteres após o livro, recortada antes de outro livro ou nova frase
        let restOfText = targetText.substring(afterBookPos, afterBookPos + 140);

        // 1. Nunca atravessa outro livro bíblico (evita unir "Salmos 3 ... Números versículo 5")
        const nextBookMatch = nextBookBoundaryRegex.exec(restOfText);
        if (nextBookMatch && nextBookMatch.index > 0) {
          restOfText = restOfText.substring(0, nextBookMatch.index);
        }

        // 2. Nunca atravessa pontuação final de outra sentença comum (ex: "Salmos 3. É você pode me ouvir...")
        const sentBreakInRest = sentenceBreakRegex.exec(restOfText);
        if (sentBreakInRest) {
          restOfText = restOfText.substring(0, sentBreakInRest.index);
        }

        const chapterPattern = /(?:(?:qual\s+(?:era|e|é)\s+(?:mesmo\s+)?(?:o\s+)?cap[ií]tulo[?.,;!\s]*|what\s+was\s+(?:the\s+)?chapter[?.,;!\s]*|lembrei\s+(?:era|foi|e|é)\s*|remembered\s+it\s+was\s*|(?:cap[ií]tulo|chapter|cap|ch)\s*(?:e|é|is|was)?\s*|^))(?:\s*(?:de|do|no|o|a|e|é|of|the|in|is|was)\s*)*(\d{1,3})/i;
        const chapMatch = chapterPattern.exec(restOfText);

        if (chapMatch) {
          const chapter = parseInt(chapMatch[1], 10);
          let afterChap = restOfText.substring(chapMatch.index + chapMatch[0].length, chapMatch.index + chapMatch[0].length + 60);

          const sentBreakAfterChap = sentenceBreakRegex.exec(afterChap);
          if (sentBreakAfterChap) {
            afterChap = afterChap.substring(0, sentBreakAfterChap.index);
          }

          const versePattern = /(?:(?:vers[ií]culos?|verses?|versos?|vers?\.?|vv?\.?|vai\s+do|do|no|from)\s+)(\d{1,3})(?:\s*(?:ao|a|ate|até|-|e|to|through|and)\s*(?:(?:o|a|the)\s+)?(?:vers[ií]culos?|verses?|versos?|vers?\.?)?\s*(\d{1,3}))?/i;
          const verseMatch = versePattern.exec(afterChap);

          if (verseMatch) {
            const verseStart = parseInt(verseMatch[1], 10);
            const verseEnd = verseMatch[2] ? parseInt(verseMatch[2], 10) : undefined;
            const matchEndIndex = afterBookPos + chapMatch.index + chapMatch[0].length + verseMatch.index + verseMatch[0].length;
            const fullRawMatch = targetText.substring(startIndex, matchEndIndex).trim();

            if (fullRawMatch.length <= 75) {
              await extractMatch(canonicalBook, chapter, verseStart, verseEnd, fullRawMatch, false);
            }
          }
        }
      }
    };

    // 1. Executa no texto original
    await runScan(text);

    // 2. Executa no texto higienizado contra erros fonéticos (ex: "somos 23" -> "Salmos 23")
    const sanitizedText = sanitizeSpeechChunk(text, targetLang || 'pt-BR');
    if (sanitizedText && sanitizedText !== text) {
      await runScan(sanitizedText);
    }

    // 3. Executa também com números por extenso convertidos em dígitos
    const baseForNumbers = sanitizedText || text;
    const normalizedNumberText = normalizeSpokenNumbers(baseForNumbers);
    if (normalizedNumberText !== baseForNumbers && normalizedNumberText !== text) {
      await runScan(normalizedNumberText);
    }

    return reconcileDetectedVerses(detected, [], baseForNumbers);
  }
}

/**
 * Reconcilia e deduplica referências bíblicas detectadas:
 * 1. Elimina capítulos isolados (is_chapter_only) quando qualquer versículo específico for citado para aquele livro e capítulo.
 * 2. Subsume versículos individuais em intervalos maiores (ex: versículo 16 é incorporado em 16-20).
 * 3. Descarta versículos fantasmas/alucinações acústicas cujo capítulo não está presente na transcrição final.
 */
export function reconcileDetectedVerses(
  existing: DetectedVerse[],
  incoming: DetectedVerse[],
  transcript: string
): DetectedVerse[] {
  let all: DetectedVerse[] = [...existing];

  for (const nv of incoming) {
    const exists = all.some(
      ex =>
        ex.book.toLowerCase() === nv.book.toLowerCase() &&
        ex.chapter === nv.chapter &&
        ex.verse_start === nv.verse_start &&
        ex.verse_end === nv.verse_end
    );
    if (!exists) {
      all.push(nv);
    }
  }

  // 1. Remove capítulo isolado se já existir qualquer versículo específico para aquele livro e capítulo
  all = all.filter(v => {
    if (!v.is_chapter_only) return true;
    const hasSpecific = all.some(
      other =>
        other !== v &&
        other.book.toLowerCase() === v.book.toLowerCase() &&
        other.chapter === v.chapter &&
        !other.is_chapter_only
    );
    return !hasSpecific;
  });

  // 2. Subsume versículo único em intervalo maior (ex: versículo 16 é absorvido por 16 ao 20)
  all = all.filter(v => {
    if (v.verse_end && v.verse_end > v.verse_start) return true;
    const coveredByRange = all.some(
      other =>
        other !== v &&
        other.book.toLowerCase() === v.book.toLowerCase() &&
        other.chapter === v.chapter &&
        other.verse_end &&
        other.verse_end > other.verse_start &&
        v.verse_start >= other.verse_start &&
        v.verse_start <= other.verse_end
    );
    return !coveredByRange;
  });

  // 3. Valida apenas novos versículos recebidos contra menção do capítulo no texto
  // (Versículos já confirmados anteriormente no culto NUNCA são descartados)
  if (transcript && transcript.trim().length > 0) {
    const normTranscript = transcript
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const numTranscript = normalizeSpokenNumbers(normTranscript);

    all = all.filter(v => {
      const chapStr = String(v.chapter);
      const chapRegex = new RegExp(`(?:^|\\D)${chapStr}(?:$|\\D)`);
      const chapterPresentInFullText = chapRegex.test(normTranscript) || chapRegex.test(numTranscript);

      const wasExisting = existing.some(
        ex =>
          ex.book.toLowerCase() === v.book.toLowerCase() &&
          ex.chapter === v.chapter &&
          ex.verse_start === v.verse_start &&
          ex.verse_end === v.verse_end
      );

      // Versículos já confirmados permanecem protegidos, EXCETO capítulos isolados fantasmas
      // criados por parciais corrigidos pelo Android (ex: "Salmos 34" -> "Salmos 3") cujo número
      // deixou de existir em todo o histórico da transcrição.
      if (wasExisting) {
        if (v.is_chapter_only && !chapterPresentInFullText) {
          return false;
        }
        return true;
      }

      return chapterPresentInFullText;
    });
  }

  return all;
}
