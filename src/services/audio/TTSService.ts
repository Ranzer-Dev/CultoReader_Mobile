import * as Speech from 'expo-speech';

export interface HumanFriendlyVoice {
  identifier: string;
  displayName: string;
  description: string;
  gender: 'female' | 'male' | 'neutral';
  isNeural: boolean;
  isRecommended: boolean;
  badge?: string;
}

const UNICODE_LETTER_CLASS = 'A-Za-zÀ-ÖØ-öø-ÿ';

export class TTSService {
  private static isSpeakingNow = false;
  private static cachedVoiceByLang = new Map<string, string>();
  private static userPreferredVoiceByLang = new Map<string, string>();
  private static activeResolve: (() => void) | null = null;
  private static speakGeneration = 0;

  private static resolveActive(): void {
    if (this.activeResolve) {
      const fn = this.activeResolve;
      this.activeResolve = null;
      fn();
    }
  }

  private static normalizeLangKey(langCode: string = 'pt-BR'): string {
    const clean = (langCode || 'pt-BR').trim().toLowerCase().replace('_', '-');
    if (clean.startsWith('en')) return 'en-US';
    if (clean.startsWith('es')) return 'es-ES';
    if (clean.startsWith('fr')) return 'fr-FR';
    if (clean.startsWith('sw')) return 'sw-KE';
    if (clean.startsWith('ts')) return 'pt-BR';
    if (clean.startsWith('pt-mz')) return 'pt-BR';
    if (clean.startsWith('pt')) return 'pt-BR';
    return 'pt-BR';
  }

  /**
   * Converte identificadores técnicos do Android (ex: 'pt-br-x-pte-local') em nomes humanos claros.
   */
  static formatFriendlyVoice(
    rawId: string,
    rawName: string,
    quality?: string,
    langLabel: string = 'Português'
  ): HumanFriendlyVoice {
    const id = (rawId || '').toLowerCase();
    const name = (rawName || '').toLowerCase();
    const isLocal = id.includes('-local') || !id.includes('-network');

    // 1. Vozes Modernas Expressivas e Naturais em Português do Brasil
    if (id.includes('pte') || name.includes('pte')) {
      return {
        identifier: rawId,
        displayName: `Voz 1 Feminina (Expressiva)${isLocal ? '' : ' • Online'}`,
        description: 'Voz feminina suave, reflexiva e com excelente entonação para leitura bíblica.',
        gender: 'female',
        isNeural: true,
        isRecommended: isLocal,
        badge: isLocal ? '✨ Offline HD' : 'Online'
      };
    }
    if (id.includes('yif') || name.includes('yif')) {
      return {
        identifier: rawId,
        displayName: `Voz 2 Masculina (Natural)${isLocal ? '' : ' • Online'}`,
        description: 'Voz masculina fluida e natural, com dicção limpa e sem tom robótico.',
        gender: 'male',
        isNeural: true,
        isRecommended: isLocal,
        badge: isLocal ? '✨ Offline HD' : 'Online'
      };
    }
    if (id.includes('jab') || name.includes('jab')) {
      return {
        identifier: rawId,
        displayName: `Voz 3 Masculina (Grave / Firme)${isLocal ? '' : ' • Online'}`,
        description: 'Voz masculina solene com registro mais encorpado.',
        gender: 'male',
        isNeural: false,
        isRecommended: isLocal,
        badge: isLocal ? 'Offline' : 'Online'
      };
    }
    if (id.includes('jbf') || name.includes('jbf')) {
      return {
        identifier: rawId,
        displayName: `Voz 4 Feminina (Padrão)${isLocal ? '' : ' • Online'}`,
        description: 'Voz feminina padrão do sistema com pronúncia clara.',
        gender: 'female',
        isNeural: false,
        isRecommended: false
      };
    }
    if (id.includes('ptd') || name.includes('ptd')) {
      return {
        identifier: rawId,
        displayName: `Voz 5 Masculina (Clássica)${isLocal ? '' : ' • Online'}`,
        description: 'Voz masculina sintetizada clássica do Google.',
        gender: 'male',
        isNeural: false,
        isRecommended: false
      };
    }
    if (id.includes('afs') || name.includes('afs')) {
      return {
        identifier: rawId,
        displayName: `Voz 6 Feminina (Clássica)${isLocal ? '' : ' • Online'}`,
        description: 'Voz feminina sintetizada clássica do Google.',
        gender: 'female',
        isNeural: false,
        isRecommended: false
      };
    }

    // 2. Classificação genérica multilíngue (EN, ES, FR, SW, Samsung, Xiaomi, etc.)
    const isFemale = id.includes('female') || id.includes('fem') || name.includes('female') || name.includes('mulher');
    const isMale = id.includes('male') || id.includes('masc') || name.includes('male') || name.includes('homem');
    const isNeural = quality === 'Enhanced' || id.includes('neural') || id.includes('natural') || name.includes('neural');

    const gender = isFemale ? 'female' : isMale ? 'male' : 'neutral';
    const genderLabel = isFemale ? 'F' : isMale ? 'M' : '';
    const cleanCode = (rawName || rawId)
      .replace(/^[a-z]{2}[-_][a-z]{2}[-_]?x?[-_]?/i, '')
      .replace(/[-_](local|network)$/i, '')
      .trim()
      .toUpperCase();

    return {
      identifier: rawId,
      displayName: `${langLabel}${genderLabel ? ` (${genderLabel})` : ''}${cleanCode ? ` • ${cleanCode}` : ''}`,
      description: isLocal
        ? (isNeural ? 'Offline HD' : 'Offline')
        : 'Online',
      gender,
      isNeural,
      isRecommended: isLocal && (isNeural || !id.endsWith('-language')),
      badge: isLocal ? (isNeural ? 'Offline HD' : 'Offline') : 'Online'
    };
  }

  /**
   * Detecta o idioma do texto de forma segura para Unicode (sem quebrar com acentos).
   * Usado apenas como fallback quando options.language não é informado.
   */
  static detectTextLanguage(text: string): string {
    const clean = (text || '').normalize('NFC').toLowerCase();
    const tokens = clean.match(/[a-zà-öø-ÿ]+/g) || [];
    if (tokens.length === 0) return 'pt-BR';

    const ptSet = new Set(['o', 'a', 'os', 'as', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'para', 'que', 'com', 'senhor', 'deus', 'disse', 'ele', 'ela', 'nós', 'eles', 'capítulo', 'versículo', 'bíblia', 'igreja', 'fé', 'graça', 'não', 'são', 'irmãos', 'coração', 'oração', 'também', 'porém', 'você']);
    const enSet = new Set(['the', 'and', 'of', 'to', 'in', 'you', 'for', 'is', 'that', 'with', 'lord', 'god', 'shall', 'unto', 'said', 'he', 'she', 'we', 'they', 'chapter', 'verse', 'bible', 'church', 'faith', 'grace', 'not', 'are', 'from', 'his', 'her', 'will', 'this']);
    const esSet = new Set(['el', 'la', 'los', 'las', 'del', 'en', 'para', 'que', 'con', 'señor', 'dios', 'dijo', 'por', 'un', 'una', 'capítulo', 'versículo', 'iglesia', 'también', 'pero', 'ellos', 'porque', 'todo', 'todos', 'corazón']);
    const frSet = new Set(['le', 'la', 'les', 'des', 'du', 'et', 'en', 'pour', 'que', 'avec', 'seigneur', 'dieu', 'dit', 'par', 'un', 'une', 'chapitre', 'verset', 'église', 'foi', 'grâce', 'dans', 'nous', 'vous', 'sont', 'mais']);
    const swSet = new Set(['na', 'ya', 'wa', 'kwa', 'ni', 'bwana', 'mungu', 'yesu', 'sura', 'mstari', 'biblia', 'kanisa', 'imani', 'neema', 'katika', 'yeye', 'wote', 'hata']);

    let pt = 0, en = 0, es = 0, fr = 0, sw = 0;
    for (const tok of tokens) {
      if (ptSet.has(tok)) pt++;
      if (enSet.has(tok)) en++;
      if (esSet.has(tok)) es++;
      if (frSet.has(tok)) fr++;
      if (swSet.has(tok)) sw++;
    }

    const scores: { lang: string; count: number }[] = [
      { lang: 'pt-BR', count: pt },
      { lang: 'en-US', count: en },
      { lang: 'es-ES', count: es },
      { lang: 'fr-FR', count: fr },
      { lang: 'sw-KE', count: sw }
    ].sort((a, b) => b.count - a.count);

    if (scores[0].count >= 2 && scores[0].count > scores[1].count) {
      return scores[0].lang;
    }
    return 'pt-BR';
  }

  /**
   * Limpeza segura de caracteres gráficos, marcadores hebraicos e normalização Unicode NFC
   * para garantir dicção perfeita de acentos (ã, ç, á, à, â, é, ê, í, ó, ô, õ, ú) em qualquer idioma.
   */
  private static cleanCommonSpeechArtifacts(text: string): string {
    return (text || '')
      // 1. Garante forma canônica NFC para acentos compostos (nunca envia diacríticos soltos ao TTS)
      .normalize('NFC')
      // 2. Remove letras hebraicas de cabeçalho (ex: Salmo 119 na NVI) e caracteres invisíveis
      .replace(/[\u0590-\u05FF\u200B-\u200D\uFEFF]/g, '')
      // 3. Remove aspas, asteriscos, jogo da velha e acentos soltos/isolados que o TTS soletraria
      .replace(/["“”‘’«»#*_~`´¨^]/g, '')
      // 4. Converte reticências e travessões em pausas naturais de respiração
      .replace(/…/g, '. ')
      .replace(/\s*[—–]\s*/g, ', ')
      // 5. Espaçamento natural após pontuações e eliminação de pontuação duplicada (ex: ". ," ou ". .")
      .replace(/\.\s*,/g, ', ')
      .replace(/,\s*\./g, '. ')
      .replace(/(?:\.\s*){2,}/g, '. ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\s*\.\s*/g, '. ')
      .replace(/\s*;\s*/g, ', ')
      .replace(/\s*:\s*/g, ', ')
      .replace(/\s*!\s*/g, '! ')
      .replace(/\s*\?\s*/g, '? ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normaliza o texto antes da leitura offline pelo sintetizador respeitando o idioma ativo.
   * ATENÇÃO: Usa fronteiras Unicode-safe (nunca \b ASCII) para JAMAI corromper palavras acentuadas
   * como "irmãos", "mãos", "bênçãos", "coração", "apóstolo", "glória", "amém", "até", "exército".
   */
  static normalizeForSpeech(text: string, lang: string = 'pt-BR'): string {
    if (!text) return '';

    const cleanLang = (lang || 'pt-BR').toLowerCase();
    // Garante Unicode NFC desde o primeiro instante
    let normalized = text.normalize('NFC');

    // 1. Normalização para Inglês
    if (cleanLang.startsWith('en')) {
      normalized = normalized.replace(/\s*[\(\[](KJV|NIV|ESV|NKJV|NVI|ARA|ACF|RVR|LSG)[\)\]]/gi, '');
      normalized = normalized.replace(
        new RegExp(`(^|[^${UNICODE_LETTER_CLASS}])([${UNICODE_LETTER_CLASS}]+)\\s+(\\d+)\\s*:\\s*(\\d+)(?:\\s*[-–]\\s*(\\d+))?(?=$|[^0-9])`, 'g'),
        (_, pre, book, cap, vStart, vEnd) =>
          vEnd
            ? `${pre}${book}, chapter ${cap}, verses ${vStart} to ${vEnd}. `
            : `${pre}${book}, chapter ${cap}, verse ${vStart}. `
      );
      return this.cleanCommonSpeechArtifacts(normalized);
    }

    // 2. Normalização para Espanhol
    if (cleanLang.startsWith('es')) {
      normalized = normalized.replace(/\s*[\(\[](RVR|NVI|LBLA|NTV|KJV|ARA)[\)\]]/gi, '');
      normalized = normalized.replace(
        new RegExp(`(^|[^${UNICODE_LETTER_CLASS}])([${UNICODE_LETTER_CLASS}]+)\\s+(\\d+)\\s*:\\s*(\\d+)(?:\\s*[-–]\\s*(\\d+))?(?=$|[^0-9])`, 'g'),
        (_, pre, book, cap, vStart, vEnd) =>
          vEnd
            ? `${pre}${book}, capítulo ${cap}, versículos ${vStart} al ${vEnd}. `
            : `${pre}${book}, capítulo ${cap}, versículo ${vStart}. `
      );
      return this.cleanCommonSpeechArtifacts(normalized);
    }

    // 3. Normalização para Francês
    if (cleanLang.startsWith('fr')) {
      normalized = normalized.replace(/\s*[\(\[](LSG|BDS|S21|NVI|KJV|ARA)[\)\]]/gi, '');
      normalized = normalized.replace(
        new RegExp(`(^|[^${UNICODE_LETTER_CLASS}])([${UNICODE_LETTER_CLASS}]+)\\s+(\\d+)\\s*:\\s*(\\d+)(?:\\s*[-–]\\s*(\\d+))?(?=$|[^0-9])`, 'g'),
        (_, pre, book, cap, vStart, vEnd) =>
          vEnd
            ? `${pre}${book}, chapitre ${cap}, versets ${vStart} à ${vEnd}. `
            : `${pre}${book}, chapitre ${cap}, verset ${vStart}. `
      );
      return this.cleanCommonSpeechArtifacts(normalized);
    }

    // 4. Normalização para Suaíli
    if (cleanLang.startsWith('sw')) {
      normalized = normalized.replace(/\s*[\(\[](SWA|SW|NVI|KJV)[\)\]]/gi, '');
      normalized = normalized.replace(
        new RegExp(`(^|[^${UNICODE_LETTER_CLASS}])([${UNICODE_LETTER_CLASS}]+)\\s+(\\d+)\\s*:\\s*(\\d+)(?:\\s*[-–]\\s*(\\d+))?(?=$|[^0-9])`, 'g'),
        (_, pre, book, cap, vStart, vEnd) =>
          vEnd
            ? `${pre}${book}, sura ya ${cap}, mistari ya ${vStart} hadi ${vEnd}. `
            : `${pre}${book}, sura ya ${cap}, mstari wa ${vStart}. `
      );
      return this.cleanCommonSpeechArtifacts(normalized);
    }

    // 5. Normalização para Português (pt-BR / pt-MZ)
    // 5.1. Remove siglas de versões bíblicas entre parênteses ou colchetes
    normalized = normalized.replace(/\s*[\(\[](ARA|NVI|ARC|NAA|ACF|NVT|KJV|RVR|LSG)[\)\]]/gi, '');

    // 5.2. Expande abreviações bíblicas SOMENTE quando:
    // - NÃO estiverem coladas a nenhuma letra Unicode (inclusive acentuadas: ã, ç, á, é, ó...)
    // - E estiverem SEGUIDAS de número de capítulo (ex: "Sl 23:1", "Os 6:3", "1 Co 13:4")
    // Isso garante 0% de corrupção em palavras normais como "os", "irmãos", "mãos", "apóstolo", "glória", "amém", "até", "exército".
    const numberedAbbrs: [string, string][] = [
      ['1\\s*co(?:r)?', 'Primeira Coríntios'],
      ['2\\s*co(?:r)?', 'Segunda Coríntios'],
      ['1\\s*ts', 'Primeira Tessalonicenses'],
      ['2\\s*ts', 'Segunda Tessalonicenses'],
      ['1\\s*tm', 'Primeira Timóteo'],
      ['2\\s*tm', 'Segunda Timóteo'],
      ['1\\s*pe(?:d)?', 'Primeira Pedro'],
      ['2\\s*pe(?:d)?', 'Segunda Pedro'],
      ['1\\s*jo', 'Primeira João'],
      ['2\\s*jo', 'Segunda João'],
      ['3\\s*jo', 'Terceira João'],
      ['1\\s*sm', 'Primeiro Samuel'],
      ['2\\s*sm', 'Segundo Samuel'],
      ['1\\s*rs', 'Primeiro Reis'],
      ['2\\s*rs', 'Segundo Reis'],
      ['1\\s*cr', 'Primeiro Crônicas'],
      ['2\\s*cr', 'Segundo Crônicas']
    ];

    for (const [abbr, full] of numberedAbbrs) {
      const rx = new RegExp(`(^|[^${UNICODE_LETTER_CLASS}0-9])(${abbr})(?=\\s+\\d)`, 'gi');
      normalized = normalized.replace(rx, `$1${full}`);
    }

    const singleAbbrs: [string, string][] = [
      ['gn', 'Gênesis'],
      ['ex', 'Êxodo'],
      ['lv', 'Levítico'],
      ['nm', 'Números'],
      ['dt', 'Deuteronômio'],
      ['js', 'Josué'],
      ['jz', 'Juízes'],
      ['rt', 'Rute'],
      ['sl', 'Salmos'],
      ['pv', 'Provérbios'],
      ['ec', 'Eclesiastes'],
      ['ct', 'Cânticos'],
      ['is', 'Isaías'],
      ['jr', 'Jeremias'],
      ['lm', 'Lamentações'],
      ['ez', 'Ezequiel'],
      ['dn', 'Daniel'],
      ['os', 'Oséias'],
      ['jl', 'Joel'],
      ['am', 'Amós'],
      ['ob', 'Obadias'],
      ['jn', 'Jonas'],
      ['mq', 'Miquéias'],
      ['na', 'Naum'],
      ['hc', 'Habacuque'],
      ['sf', 'Sofonias'],
      ['ag', 'Ageu'],
      ['zc', 'Zacarias'],
      ['ml', 'Malaquias'],
      ['mt', 'Mateus'],
      ['mc', 'Marcos'],
      ['lc', 'Lucas'],
      ['jo', 'João'],
      ['at', 'Atos'],
      ['rm', 'Romanos'],
      ['gl', 'Gálatas'],
      ['ef', 'Efésios'],
      ['fp', 'Filipenses'],
      ['cl', 'Colossenses'],
      ['tt', 'Tito'],
      ['fm', 'Filemom'],
      ['hb', 'Hebreus'],
      ['tg', 'Tiago'],
      ['jd', 'Judas'],
      ['ap', 'Apocalipse']
    ];

    for (const [abbr, full] of singleAbbrs) {
      // Só expande abreviação de 2 letras quando seguida diretamente por capítulo (ex: "Sl 23", "Rm 8:28")
      const rx = new RegExp(`(^|[^${UNICODE_LETTER_CLASS}])(${abbr})(?=\\s+\\d)`, 'gi');
      normalized = normalized.replace(rx, `$1${full}`);
    }

    // 5.3. Expande "1/2/3 [Nome de Livro Bíblico]" com segurança (não altera "1 dia", "2 horas", etc.)
    normalized = normalized.replace(
      new RegExp(`(^|[^${UNICODE_LETTER_CLASS}0-9])(1|2|3)\\s+(Samuel|Reis|Cr[oô]nicas|Cor[ií]ntios|Tessalonicenses|Tim[oó]teo|Pedro|Jo[aã]o)(?=$|[^${UNICODE_LETTER_CLASS}])`, 'gi'),
      (_, pre, num, book) => {
        const b = book.toLowerCase();
        const isMasc =
          b.startsWith('samuel') ||
          b.startsWith('reis') ||
          b.startsWith('cr') ||
          b.startsWith('tim') ||
          b.startsWith('pedro');
        if (num === '1') return `${pre}${isMasc ? 'Primeiro' : 'Primeira'} ${book}`;
        if (num === '2') return `${pre}${isMasc ? 'Segundo' : 'Segunda'} ${book}`;
        return `${pre}${isMasc ? 'Terceiro' : 'Terceira'} ${book}`;
      }
    );

    // 5.4. Converte citações bíblicas "Livro X:Y" ou "Livro X:Y-Z" para fala fluida humana
    normalized = normalized.replace(
      new RegExp(`(^|[^${UNICODE_LETTER_CLASS}])([${UNICODE_LETTER_CLASS}]+)\\s+(\\d+)\\s*:\\s*(\\d+)(?:\\s*[-–]\\s*(\\d+))?(?=$|[^0-9])`, 'g'),
      (_, pre, book, cap, vStart, vEnd) => {
        if (vEnd) {
          return `${pre}${book}, capítulo ${cap}, versículos ${vStart} a ${vEnd}. `;
        }
        return `${pre}${book}, capítulo ${cap}, versículo ${vStart}. `;
      }
    );

    // 5.5. Limpeza final NFC + pontuação natural
    return this.cleanCommonSpeechArtifacts(normalized);
  }

  /**
   * Pontua uma voz do sistema priorizando vozes OFFLINE (-local) e neurais expressivas,
   * evitando vozes -network que falham sem internet e sintetizadores robóticos legados.
   */
  private static scoreVoice(v: Speech.Voice, targetLocale: string): number {
    const id = (v.identifier || '').toLowerCase();
    const name = (v.name || '').toLowerCase();
    const lang = (v.language || '').toLowerCase().replace('_', '-');
    const qual = (v.quality || '').toString().toLowerCase();
    const targetLower = targetLocale.toLowerCase();

    let pts = 0;

    // 1. Offline-first: SEMPRE prioriza vozes locais (-local) sobre vozes de rede (-network)
    if (id.includes('-local') || name.includes('-local')) pts += 250;
    if (id.includes('-network') || name.includes('-network')) pts -= 400;

    // 2. Penalização severa de sintetizadores robóticos legados
    if (id.endsWith('-language') || id.includes('_lang')) pts -= 500;
    if (id.includes('pico') || name.includes('pico') || id.includes('espeak') || id.includes('smt')) pts -= 500;

    // 3. Correspondência exata de região (ex: pt-br vs pt-pt, en-us vs en-in)
    if (lang === targetLower || id.includes(targetLower)) pts += 120;

    // 4. Preferências de naturalidade comprovadas no Google Speech Services para pt-BR
    if (targetLower.startsWith('pt')) {
      if (id.includes('pte') || name.includes('pte')) pts += 350;
      if (id.includes('yif') || name.includes('yif')) pts += 300;
      if (id.includes('jab') || name.includes('jab')) pts += 120;
      if (id.includes('afs') || name.includes('afs')) pts -= 150;
      if (id.includes('ptd') || name.includes('ptd')) pts -= 150;
    }

    if (qual.includes('enhanced') || qual.includes('high') || id.includes('neural') || id.includes('natural')) {
      pts += 40;
    }
    if (id.includes('google') || name.includes('google')) pts += 20;

    return pts;
  }

  private static async fetchVoicesSafe(): Promise<Speech.Voice[]> {
    try {
      let voices = await Speech.getAvailableVoicesAsync();
      if (!voices || voices.length === 0) {
        await new Promise(r => setTimeout(r, 350));
        voices = await Speech.getAvailableVoicesAsync();
      }
      return voices || [];
    } catch {
      return [];
    }
  }

  private static filterVoicesByLang(voices: Speech.Voice[], normalizedLocale: string): Speech.Voice[] {
    const targetLower = normalizedLocale.toLowerCase();
    const prefix = targetLower.split('-')[0];

    if (prefix === 'pt') {
      const ptBr = voices.filter(v => {
        const lang = (v.language || '').toLowerCase().replace('_', '-');
        const id = (v.identifier || '').toLowerCase();
        const name = (v.name || '').toLowerCase();
        return (
          lang === 'pt-br' ||
          lang.startsWith('pt-br') ||
          id.includes('pt-br') ||
          id.includes('pt_br') ||
          id.includes('por-bra') ||
          id.includes('brazil') ||
          name.includes('brazil') ||
          name.includes('brasil')
        );
      });
      if (ptBr.length > 0) return ptBr;
      return voices.filter(v => {
        const lang = (v.language || '').toLowerCase().replace('_', '-');
        return lang.startsWith('pt') && !lang.includes('pt-pt');
      });
    }

    return voices.filter(v => {
      const lang = (v.language || '').toLowerCase().replace('_', '-');
      const id = (v.identifier || '').toLowerCase();
      return lang.startsWith(prefix) || id.startsWith(`${prefix}-`) || id.startsWith(`${prefix}_`);
    });
  }

  /**
   * Identifica a melhor voz offline local para Português do Brasil (pt-BR).
   */
  static async getBestLocalVoiceAsync(): Promise<string | undefined> {
    return this.getBestVoiceForLanguageAsync('pt-BR');
  }

  static setUserPreferredVoice(voiceId: string, langCode: string = 'pt-BR'): void {
    const key = this.normalizeLangKey(langCode);
    this.userPreferredVoiceByLang.set(key, voiceId);
    this.cachedVoiceByLang.set(key, voiceId);
  }

  static async getAvailablePtBrVoices(): Promise<HumanFriendlyVoice[]> {
    return this.getAvailableVoicesForLanguage('pt-BR');
  }

  static async getAvailableVoicesForLanguage(langCode: string = 'pt-BR'): Promise<HumanFriendlyVoice[]> {
    const normalizedLocale = this.normalizeLangKey(langCode);
    const voices = await this.fetchVoicesSafe();
    if (voices.length === 0) return [];

    const filtered = this.filterVoicesByLang(voices, normalizedLocale);
    const langLabels: Record<string, string> = {
      'pt-BR': 'Português',
      'en-US': 'English',
      'es-ES': 'Español',
      'fr-FR': 'Français',
      'sw-KE': 'Kiswahili'
    };
    const label = langLabels[normalizedLocale] || normalizedLocale;

    // Prioriza vozes locais (offline) e ordena por qualidade
    const ranked = [...filtered].sort(
      (a, b) => this.scoreVoice(b, normalizedLocale) - this.scoreVoice(a, normalizedLocale)
    );

    return ranked.slice(0, 12).map(v =>
      this.formatFriendlyVoice(v.identifier, v.name, v.quality?.toString(), label)
    );
  }

  static async getBestVoiceForLanguageAsync(langCode: string = 'pt-BR'): Promise<string | undefined> {
    const normalizedLocale = this.normalizeLangKey(langCode);

    const userPref = this.userPreferredVoiceByLang.get(normalizedLocale);
    if (userPref) return userPref;

    const cached = this.cachedVoiceByLang.get(normalizedLocale);
    if (cached) return cached;

    const voices = await this.fetchVoicesSafe();
    if (voices.length === 0) return undefined;

    const matching = this.filterVoicesByLang(voices, normalizedLocale);
    if (matching.length === 0) return undefined;

    const ranked = [...matching].sort(
      (a, b) => this.scoreVoice(b, normalizedLocale) - this.scoreVoice(a, normalizedLocale)
    );

    const best = ranked[0];
    if (best) {
      this.cachedVoiceByLang.set(normalizedLocale, best.identifier);
      return best.identifier;
    }
    return undefined;
  }

  static async speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      language?: string;
      voice?: string;
      onDone?: () => void;
      onStart?: () => void;
    }
  ): Promise<void> {
    if (!text || text.trim().length === 0) return;

    const myGeneration = ++this.speakGeneration;

    if (this.isSpeakingNow || this.activeResolve) {
      await this.stop();
      // Se outra chamada chegou enquanto estávamos parando, aborta esta antiga
      if (myGeneration !== this.speakGeneration) return;
    }

    this.isSpeakingNow = true;

    // 1. Identifica o idioma correto (explicitamente passado ou detectado do texto)
    const rawLang = options?.language || this.detectTextLanguage(text);
    const activeLang = this.normalizeLangKey(rawLang);

    // 2. Aplica a camada de pré-processamento fonético Unicode-safe no idioma correto
    const cleanSpokenText = this.normalizeForSpeech(text, activeLang);
    if (!cleanSpokenText) {
      this.isSpeakingNow = false;
      options?.onDone?.();
      return;
    }

    // 3. Identifica melhor voz offline para aquele idioma específico
    let preferredVoice = options?.voice;
    if (!preferredVoice) {
      preferredVoice = await this.getBestVoiceForLanguageAsync(activeLang);
    }

    if (myGeneration !== this.speakGeneration) return;

    // 4. Fala e aguarda conclusão (onDone / onStopped / onError) para permitir leitura contínua sem cortes
    return new Promise<void>((resolve) => {
      const finish = () => {
        if (this.activeResolve === finish) {
          this.activeResolve = null;
        }
        if (myGeneration === this.speakGeneration) {
          this.isSpeakingNow = false;
        }
        options?.onDone?.();
        resolve();
      };

      this.activeResolve = finish;

      try {
        Speech.speak(cleanSpokenText, {
          language: activeLang,
          rate: options?.rate ?? 0.94,
          pitch: options?.pitch ?? 1.0,
          voice: preferredVoice,
          onStart: () => {
            if (myGeneration === this.speakGeneration) {
              this.isSpeakingNow = true;
            }
            options?.onStart?.();
          },
          onDone: finish,
          onStopped: finish,
          onError: finish
        });
      } catch {
        finish();
      }
    });
  }

  static async stop(): Promise<void> {
    this.speakGeneration++;
    try {
      await Speech.stop();
    } catch {
      // Ignorar erros caso Speech não estivesse ativo
    } finally {
      this.isSpeakingNow = false;
      this.resolveActive();
    }
  }

  static async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return this.isSpeakingNow;
    }
  }
}
