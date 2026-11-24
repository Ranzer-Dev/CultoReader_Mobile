export interface CanonicalBookInfo {
  id: number;
  testament: 'OT' | 'NT';
  abbrev: string;
  chaptersCount: number;
  names: {
    pt: string;
    en: string;
    es: string;
    fr: string;
    sw: string;
    ts: string;
  };
}

export const CANONICAL_BOOKS: CanonicalBookInfo[] = [
  // Antigo Testamento / Old Testament (39 Livros)
  { id: 1, testament: 'OT', abbrev: 'gn', chaptersCount: 50, names: { pt: 'Gênesis', en: 'Genesis', es: 'Génesis', fr: 'Genèse', sw: 'Mwanzo', ts: 'Genesi' } },
  { id: 2, testament: 'OT', abbrev: 'ex', chaptersCount: 40, names: { pt: 'Êxodo', en: 'Exodus', es: 'Éxodo', fr: 'Exode', sw: 'Kutoka', ts: 'Eksoda' } },
  { id: 3, testament: 'OT', abbrev: 'lv', chaptersCount: 27, names: { pt: 'Levítico', en: 'Leviticus', es: 'Levítico', fr: 'Lévitique', sw: 'Mambo ya Walawi', ts: 'Levhitika' } },
  { id: 4, testament: 'OT', abbrev: 'nm', chaptersCount: 36, names: { pt: 'Números', en: 'Numbers', es: 'Números', fr: 'Nombres', sw: 'Hesabu', ts: 'Tinhlayo' } },
  { id: 5, testament: 'OT', abbrev: 'dt', chaptersCount: 34, names: { pt: 'Deuteronômio', en: 'Deuteronomy', es: 'Deuteronomio', fr: 'Deutéronome', sw: 'Kumbukumbu la Torati', ts: 'Deteronoma' } },
  { id: 6, testament: 'OT', abbrev: 'js', chaptersCount: 24, names: { pt: 'Josué', en: 'Joshua', es: 'Josué', fr: 'Josué', sw: 'Yoshua', ts: 'Yoxuwa' } },
  { id: 7, testament: 'OT', abbrev: 'jz', chaptersCount: 21, names: { pt: 'Juízes', en: 'Judges', es: 'Jueces', fr: 'Juges', sw: 'Waamuzi', ts: 'Vaavanyisi' } },
  { id: 8, testament: 'OT', abbrev: 'rt', chaptersCount: 4, names: { pt: 'Rute', en: 'Ruth', es: 'Rut', fr: 'Ruth', sw: 'Ruthi', ts: 'Rhuti' } },
  { id: 9, testament: 'OT', abbrev: '1sm', chaptersCount: 31, names: { pt: '1 Samuel', en: '1 Samuel', es: '1 Samuel', fr: '1 Samuel', sw: '1 Samweli', ts: '1 Samuwele' } },
  { id: 10, testament: 'OT', abbrev: '2sm', chaptersCount: 24, names: { pt: '2 Samuel', en: '2 Samuel', es: '2 Samuel', fr: '2 Samuel', sw: '2 Samweli', ts: '2 Samuwele' } },
  { id: 11, testament: 'OT', abbrev: '1rs', chaptersCount: 22, names: { pt: '1 Reis', en: '1 Kings', es: '1 Reyes', fr: '1 Rois', sw: '1 Wafalme', ts: '1 Tihosi' } },
  { id: 12, testament: 'OT', abbrev: '2rs', chaptersCount: 25, names: { pt: '2 Reis', en: '2 Kings', es: '2 Reyes', fr: '2 Rois', sw: '2 Wafalme', ts: '2 Tihosi' } },
  { id: 13, testament: 'OT', abbrev: '1cr', chaptersCount: 29, names: { pt: '1 Crônicas', en: '1 Chronicles', es: '1 Crónicas', fr: '1 Chroniques', sw: '1 Mambo ya Nyakati', ts: '1 Tikronika' } },
  { id: 14, testament: 'OT', abbrev: '2cr', chaptersCount: 36, names: { pt: '2 Crônicas', en: '2 Chronicles', es: '2 Crónicas', fr: '2 Chroniques', sw: '2 Mambo ya Nyakati', ts: '2 Tikronika' } },
  { id: 15, testament: 'OT', abbrev: 'ed', chaptersCount: 10, names: { pt: 'Esdras', en: 'Ezra', es: 'Esdras', fr: 'Esdras', sw: 'Ezra', ts: 'Ezra' } },
  { id: 16, testament: 'OT', abbrev: 'ne', chaptersCount: 13, names: { pt: 'Neemias', en: 'Nehemiah', es: 'Nehemías', fr: 'Néhémie', sw: 'Nehemia', ts: 'Nehemiya' } },
  { id: 17, testament: 'OT', abbrev: 'et', chaptersCount: 10, names: { pt: 'Ester', en: 'Esther', es: 'Ester', fr: 'Esther', sw: 'Esta', ts: 'Estere' } },
  { id: 18, testament: 'OT', abbrev: 'job', chaptersCount: 42, names: { pt: 'Jó', en: 'Job', es: 'Job', fr: 'Job', sw: 'Ayubu', ts: 'Yobo' } },
  { id: 19, testament: 'OT', abbrev: 'sl', chaptersCount: 150, names: { pt: 'Salmos', en: 'Psalms', es: 'Salmos', fr: 'Psaumes', sw: 'Zaburi', ts: 'Tinsimu' } },
  { id: 20, testament: 'OT', abbrev: 'pv', chaptersCount: 31, names: { pt: 'Provérbios', en: 'Proverbs', es: 'Proverbios', fr: 'Proverbes', sw: 'Mithali', ts: 'Swivuriso' } },
  { id: 21, testament: 'OT', abbrev: 'ec', chaptersCount: 12, names: { pt: 'Eclesiastes', en: 'Ecclesiastes', es: 'Eclesiastés', fr: 'Ecclésiaste', sw: 'Mhubiri', ts: 'Eklesiasta' } },
  { id: 22, testament: 'OT', abbrev: 'ct', chaptersCount: 8, names: { pt: 'Cânticos', en: 'Song of Solomon', es: 'Cantares', fr: 'Cantique des Cantiques', sw: 'Wimbo Ulio Bora', ts: 'Risimu ra Tinsimu' } },
  { id: 23, testament: 'OT', abbrev: 'is', chaptersCount: 66, names: { pt: 'Isaías', en: 'Isaiah', es: 'Isaías', fr: 'Ésaïe', sw: 'Isaya', ts: 'Esaya' } },
  { id: 24, testament: 'OT', abbrev: 'jr', chaptersCount: 52, names: { pt: 'Jeremias', en: 'Jeremiah', es: 'Jeremías', fr: 'Jérémie', sw: 'Yeremia', ts: 'Yeremiya' } },
  { id: 25, testament: 'OT', abbrev: 'lm', chaptersCount: 5, names: { pt: 'Lamentações', en: 'Lamentations', es: 'Lamentaciones', fr: 'Lamentations', sw: 'Maombolezo', ts: 'Swirilo' } },
  { id: 26, testament: 'OT', abbrev: 'ez', chaptersCount: 48, names: { pt: 'Ezequiel', en: 'Ezekiel', es: 'Ezequiel', fr: 'Ézéchiel', sw: 'Ezekieli', ts: 'Ezekiyele' } },
  { id: 27, testament: 'OT', abbrev: 'dn', chaptersCount: 12, names: { pt: 'Daniel', en: 'Daniel', es: 'Daniel', fr: 'Daniel', sw: 'Danieli', ts: 'Daniyeli' } },
  { id: 28, testament: 'OT', abbrev: 'os', chaptersCount: 14, names: { pt: 'Oséias', en: 'Hosea', es: 'Oseas', fr: 'Osée', sw: 'Hosea', ts: 'Hosiya' } },
  { id: 29, testament: 'OT', abbrev: 'jl', chaptersCount: 3, names: { pt: 'Joel', en: 'Joel', es: 'Joel', fr: 'Joël', sw: 'Yoeli', ts: 'Yowele' } },
  { id: 30, testament: 'OT', abbrev: 'am', chaptersCount: 9, names: { pt: 'Amós', en: 'Amos', es: 'Amós', fr: 'Amos', sw: 'Amosi', ts: 'Amosi' } },
  { id: 31, testament: 'OT', abbrev: 'ob', chaptersCount: 1, names: { pt: 'Obadias', en: 'Obadiah', es: 'Abdías', fr: 'Abdias', sw: 'Obadia', ts: 'Obadiya' } },
  { id: 32, testament: 'OT', abbrev: 'jn', chaptersCount: 4, names: { pt: 'Jonas', en: 'Jonah', es: 'Jonás', fr: 'Jonas', sw: 'Yona', ts: 'Yonasi' } },
  { id: 33, testament: 'OT', abbrev: 'mq', chaptersCount: 7, names: { pt: 'Miquéias', en: 'Micah', es: 'Miqueas', fr: 'Michée', sw: 'Mika', ts: 'Mikiya' } },
  { id: 34, testament: 'OT', abbrev: 'na', chaptersCount: 3, names: { pt: 'Naum', en: 'Nahum', es: 'Nahúm', fr: 'Nahum', sw: 'Nahumu', ts: 'Nahumi' } },
  { id: 35, testament: 'OT', abbrev: 'hc', chaptersCount: 3, names: { pt: 'Habacuque', en: 'Habakkuk', es: 'Habacuc', fr: 'Habacuc', sw: 'Habakuki', ts: 'Habakuku' } },
  { id: 36, testament: 'OT', abbrev: 'sf', chaptersCount: 3, names: { pt: 'Sofonias', en: 'Zephaniah', es: 'Sofonías', fr: 'Sophonie', sw: 'Sefania', ts: 'Sofoniya' } },
  { id: 37, testament: 'OT', abbrev: 'ag', chaptersCount: 2, names: { pt: 'Ageu', en: 'Haggai', es: 'Hageo', fr: 'Aggée', sw: 'Hagai', ts: 'Hagayi' } },
  { id: 38, testament: 'OT', abbrev: 'zc', chaptersCount: 14, names: { pt: 'Zacarias', en: 'Zechariah', es: 'Zacarías', fr: 'Zacharie', sw: 'Zekaria', ts: 'Zakariya' } },
  { id: 39, testament: 'OT', abbrev: 'ml', chaptersCount: 4, names: { pt: 'Malaquias', en: 'Malachi', es: 'Malaquías', fr: 'Malachie', sw: 'Malaki', ts: 'Malakiya' } },

  // Novo Testamento / New Testament (27 Livros)
  { id: 40, testament: 'NT', abbrev: 'mt', chaptersCount: 28, names: { pt: 'Mateus', en: 'Matthew', es: 'Mateo', fr: 'Matthieu', sw: 'Mathayo', ts: 'Matewu' } },
  { id: 41, testament: 'NT', abbrev: 'mc', chaptersCount: 16, names: { pt: 'Marcos', en: 'Mark', es: 'Marcos', fr: 'Marc', sw: 'Marko', ts: 'Marka' } },
  { id: 42, testament: 'NT', abbrev: 'lc', chaptersCount: 24, names: { pt: 'Lucas', en: 'Luke', es: 'Lucas', fr: 'Luc', sw: 'Luka', ts: 'Luka' } },
  { id: 43, testament: 'NT', abbrev: 'jo', chaptersCount: 21, names: { pt: 'João', en: 'John', es: 'Juan', fr: 'Jean', sw: 'Yohana', ts: 'Yohane' } },
  { id: 44, testament: 'NT', abbrev: 'at', chaptersCount: 28, names: { pt: 'Atos', en: 'Acts', es: 'Hechos', fr: 'Actes', sw: 'Matendo', ts: 'Mitirho' } },
  { id: 45, testament: 'NT', abbrev: 'rm', chaptersCount: 16, names: { pt: 'Romanos', en: 'Romans', es: 'Romanos', fr: 'Romains', sw: 'Warumi', ts: 'Varhoma' } },
  { id: 46, testament: 'NT', abbrev: '1co', chaptersCount: 16, names: { pt: '1 Coríntios', en: '1 Corinthians', es: '1 Corintios', fr: '1 Corinthiens', sw: '1 Wakorintho', ts: '1 Vakorinto' } },
  { id: 47, testament: 'NT', abbrev: '2co', chaptersCount: 13, names: { pt: '2 Coríntios', en: '2 Corinthians', es: '2 Corintios', fr: '2 Corinthiens', sw: '2 Wakorintho', ts: '2 Vakorinto' } },
  { id: 48, testament: 'NT', abbrev: 'gl', chaptersCount: 6, names: { pt: 'Gálatas', en: 'Galatians', es: 'Gálatas', fr: 'Galates', sw: 'Wagalatia', ts: 'Vagalatiya' } },
  { id: 49, testament: 'NT', abbrev: 'ef', chaptersCount: 6, names: { pt: 'Efésios', en: 'Ephesians', es: 'Efesios', fr: 'Éphésiens', sw: 'Waefeso', ts: 'Vaefesa' } },
  { id: 50, testament: 'NT', abbrev: 'fp', chaptersCount: 4, names: { pt: 'Filipenses', en: 'Philippians', es: 'Filipenses', fr: 'Philippiens', sw: 'Wafilipi', ts: 'Vafilipiya' } },
  { id: 51, testament: 'NT', abbrev: 'cl', chaptersCount: 4, names: { pt: 'Colossenses', en: 'Colossians', es: 'Colosenses', fr: 'Colossiens', sw: 'Wakolosai', ts: 'Vakolosa' } },
  { id: 52, testament: 'NT', abbrev: '1ts', chaptersCount: 5, names: { pt: '1 Tessalonicenses', en: '1 Thessalonians', es: '1 Tesalonicenses', fr: '1 Thessaloniciens', sw: '1 Watesalonike', ts: '1 Vatesalonika' } },
  { id: 53, testament: 'NT', abbrev: '2ts', chaptersCount: 3, names: { pt: '2 Tessalonicenses', en: '2 Thessalonians', es: '2 Tesalonicenses', fr: '2 Thessaloniciens', sw: '2 Watesalonike', ts: '2 Vatesalonika' } },
  { id: 54, testament: 'NT', abbrev: '1tm', chaptersCount: 6, names: { pt: '1 Timóteo', en: '1 Timothy', es: '1 Timoteo', fr: '1 Timothée', sw: '1 Timotheo', ts: '1 Timotiya' } },
  { id: 55, testament: 'NT', abbrev: '2tm', chaptersCount: 4, names: { pt: '2 Timóteo', en: '2 Timothy', es: '2 Timoteo', fr: '2 Timothée', sw: '2 Timotheo', ts: '2 Timotiya' } },
  { id: 56, testament: 'NT', abbrev: 'tt', chaptersCount: 3, names: { pt: 'Tito', en: 'Titus', es: 'Tito', fr: 'Tite', sw: 'Tito', ts: 'Tito' } },
  { id: 57, testament: 'NT', abbrev: 'fm', chaptersCount: 1, names: { pt: 'Filemom', en: 'Philemon', es: 'Filemón', fr: 'Philémon', sw: 'Filemoni', ts: 'Filemoni' } },
  { id: 58, testament: 'NT', abbrev: 'hb', chaptersCount: 13, names: { pt: 'Hebreus', en: 'Hebrews', es: 'Hebreos', fr: 'Hébreux', sw: 'Waebrania', ts: 'Vaheveru' } },
  { id: 59, testament: 'NT', abbrev: 'tg', chaptersCount: 5, names: { pt: 'Tiago', en: 'James', es: 'Santiago', fr: 'Jacques', sw: 'Yakobo', ts: 'Yakobo' } },
  { id: 60, testament: 'NT', abbrev: '1pe', chaptersCount: 5, names: { pt: '1 Pedro', en: '1 Peter', es: '1 Pedro', fr: '1 Pierre', sw: '1 Petro', ts: '1 Petro' } },
  { id: 61, testament: 'NT', abbrev: '2pe', chaptersCount: 3, names: { pt: '2 Pedro', en: '2 Peter', es: '2 Pedro', fr: '2 Pierre', sw: '2 Petro', ts: '2 Petro' } },
  { id: 62, testament: 'NT', abbrev: '1jo', chaptersCount: 5, names: { pt: '1 João', en: '1 John', es: '1 Juan', fr: '1 Jean', sw: '1 Yohana', ts: '1 Yohane' } },
  { id: 63, testament: 'NT', abbrev: '2jo', chaptersCount: 1, names: { pt: '2 João', en: '2 John', es: '2 Juan', fr: '2 Jean', sw: '2 Yohana', ts: '2 Yohane' } },
  { id: 64, testament: 'NT', abbrev: '3jo', chaptersCount: 1, names: { pt: '3 João', en: '3 John', es: '3 Juan', fr: '3 Jean', sw: '3 Yohana', ts: '3 Yohane' } },
  { id: 65, testament: 'NT', abbrev: 'jd', chaptersCount: 1, names: { pt: 'Judas', en: 'Jude', es: 'Judas', fr: 'Jude', sw: 'Yuda', ts: 'Yuda' } },
  { id: 66, testament: 'NT', abbrev: 'ap', chaptersCount: 22, names: { pt: 'Apocalipse', en: 'Revelation', es: 'Apocalipsis', fr: 'Apocalypse', sw: 'Ufunuo', ts: 'Nhlavutelo' } }
];
