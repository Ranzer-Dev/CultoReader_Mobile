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

export class TTSService {
  private static isSpeakingNow = false;
  private static cachedVoiceId: string | null = null;
  private static hasCheckedVoices = false;

  /**
   * Converte identificadores técnicos do Android (ex: 'pt-br-x-afs-local') em nomes humanos elegantes e claros.
   */
  static formatFriendlyVoice(rawId: string, rawName: string, quality?: string): HumanFriendlyVoice {
    const id = (rawId || '').toLowerCase();
    const name = (rawName || '').toLowerCase();

    // 1. Vozes Modernas Expressivas e Naturais (confirmadas como as mais humanas no aparelho)
    if (id.includes('pte') || name.includes('pte')) {
      return {
        identifier: rawId,
        displayName: 'Voz 1 Feminina (Expressiva)',
        description: 'Voz feminina suave, reflexiva e com excelente entonação para leitura bíblica.',
        gender: 'female',
        isNeural: true,
        isRecommended: true,
        badge: '✨ Mais Humana'
      };
    }
    if (id.includes('yif') || name.includes('yif')) {
      return {
        identifier: rawId,
        displayName: 'Voz 2 Masculina (Natural)',
        description: 'Voz masculina fluida e natural, com dicção limpa e sem tom robótico.',
        gender: 'male',
        isNeural: true,
        isRecommended: true,
        badge: '✨ Mais Humana'
      };
    }
    if (id.includes('jab') || name.includes('jab')) {
      return {
        identifier: rawId,
        displayName: 'Voz 3 Masculina (Grave / Firme)',
        description: 'Voz masculina solene com registro mais encorpado.',
        gender: 'male',
        isNeural: false,
        isRecommended: true,
        badge: 'Recomendada'
      };
    }
    if (id.includes('jbf') || name.includes('jbf')) {
      return {
        identifier: rawId,
        displayName: 'Voz 4 Feminina (Padrão)',
        description: 'Voz feminina padrão do sistema com pronúncia clara.',
        gender: 'female',
        isNeural: false,
        isRecommended: false
      };
    }
    if (id.includes('ptd') || name.includes('ptd')) {
      return {
        identifier: rawId,
        displayName: 'Voz 5 Masculina (Google Tradutor Clássico)',
        description: 'Voz masculina sintetizada básica do Google.',
        gender: 'male',
        isNeural: false,
        isRecommended: false
      };
    }
    if (id.includes('afs') || name.includes('afs')) {
      return {
        identifier: rawId,
        displayName: 'Voz 6 Feminina (Google Tradutor Clássico)',
        description: 'Voz feminina sintetizada básica do Google.',
        gender: 'female',
        isNeural: false,
        isRecommended: false
      };
    }

    // 2. Classificação para outros sintetizadores (Samsung, Xiaomi, etc.)
    const isFemale = id.includes('female') || id.includes('fem') || name.includes('female') || name.includes('mulher');
    const isMale = id.includes('male') || id.includes('masc') || name.includes('male') || name.includes('homem');
    const isNeural = quality === 'Enhanced' || id.includes('neural') || id.includes('natural') || name.includes('neural');

    const gender = isFemale ? 'female' : isMale ? 'male' : 'neutral';
    const genderLabel = isFemale ? 'Feminina' : isMale ? 'Masculina' : 'Sistema';
    const cleanLabel = rawName ? rawName.replace(/^pt[-_]br[-_]?/i, '').replace(/[-_]local/i, '').trim() : '';

    return {
      identifier: rawId,
      displayName: `Voz ${genderLabel} ${cleanLabel ? `(${cleanLabel})` : '(Português)'}`,
      description: isNeural ? 'Voz com processamento neural aprimorado.' : 'Voz instalada no aparelho.',
      gender,
      isNeural,
      isRecommended: isNeural,
      badge: isNeural ? 'HD' : undefined
    };
  }

  static detectTextLanguage(text: string): string {
    const clean = (text || '').toLowerCase();
    const enWords = clean.match(/\b(the|and|of|to|in|you|for|is|that|with|lord|god|jesus|shall|unto|said|he|she|we|they|chapter|verse|bible|church|faith|grace)\b/gi) || [];
    const ptWords = clean.match(/\b(o|a|os|as|de|do|da|dos|das|em|no|na|nos|nas|para|que|com|senhor|deus|jesus|disse|ele|ela|nós|eles|cap[ií]tulo|vers[ií]culo|b[ií]blia|igreja|f[eé]|gra[cç]a)\b/gi) || [];
    const esWords = clean.match(/\b(el|la|los|las|del|en|para|que|con|señor|dios|dijo|por|un|una|cap[ií]tulo|vers[ií]culo|iglesia)\b/gi) || [];

    if (enWords.length > ptWords.length && enWords.length > esWords.length && enWords.length >= 2) {
      return 'en-US';
    }
    if (esWords.length > ptWords.length && esWords.length > enWords.length && esWords.length >= 2) {
      return 'es-ES';
    }
    return 'pt-BR';
  }

  /**
   * Normaliza o texto antes da leitura offline pelo sintetizador respeitando o idioma ativo
   */
  static normalizeForSpeech(text: string, lang: string = 'pt-BR'): string {
    if (!text) return '';

    const cleanLang = (lang || 'pt-BR').toLowerCase();

    // 1. Normalização para Inglês
    if (cleanLang.startsWith('en')) {
      let enNorm = text;
      enNorm = enNorm.replace(/\s*[\(\[](KJV|NIV|ESV|NKJV|NVI|ARA)[\)\]]/gi, '');
      enNorm = enNorm.replace(/\b([A-Za-z]+)\s+(\d+)[:.](\d+)(?:\s*[-–to]+\s*(\d+))?\b/g, (match, book, cap, vStart, vEnd) => {
        if (vEnd) {
          return `${book}, chapter ${cap}, verses ${vStart} to ${vEnd}. `;
        }
        return `${book}, chapter ${cap}, verse ${vStart}. `;
      });
      enNorm = enNorm.replace(/\b(\d+)[:.](\d+)\b/g, 'chapter $1, verse $2. ');
      enNorm = enNorm.replace(/["“”«»#*_~`]/g, '');
      enNorm = enNorm.replace(/\s*,\s*/g, ', ');
      enNorm = enNorm.replace(/\s*\.\s*/g, '. ');
      enNorm = enNorm.replace(/\s{2,}/g, ' ');
      return enNorm.trim();
    }

    // 2. Normalização para Espanhol
    if (cleanLang.startsWith('es')) {
      let esNorm = text;
      esNorm = esNorm.replace(/\s*[\(\[](RVR|NVI|LBLA|NTV)[\)\]]/gi, '');
      esNorm = esNorm.replace(/\b([A-Za-zÀ-ÿ]+)\s+(\d+)[:.](\d+)(?:\s*[-–ao]+\s*(\d+))?\b/g, (match, book, cap, vStart, vEnd) => {
        if (vEnd) {
          return `${book}, capítulo ${cap}, versículos ${vStart} al ${vEnd}. `;
        }
        return `${book}, capítulo ${cap}, versículo ${vStart}. `;
      });
      esNorm = esNorm.replace(/\b(\d+)[:.](\d+)\b/g, 'capítulo $1, versículo $2. ');
      esNorm = esNorm.replace(/["“”«»#*_~`]/g, '');
      esNorm = esNorm.replace(/\s*,\s*/g, ', ');
      esNorm = esNorm.replace(/\s*\.\s*/g, '. ');
      esNorm = esNorm.replace(/\s{2,}/g, ' ');
      return esNorm.trim();
    }

    let normalized = text;

    // 1. Remove siglas de versões bíblicas entre parênteses ou colchetes
    normalized = normalized.replace(/\s*[\(\[](ARA|NVI|ARC|NAA|ACF|NVT)[\)\]]/gi, '');

    // 2. Mapeamento de abreviações bíblicas comuns para o nome por extenso
    const abbrMap = [
      { pattern: /\b(1|primeir[oa])\s*co(?:r(?:intios)?)?\b/gi, replacement: 'Primeira Coríntios' },
      { pattern: /\b(2|segund[oa])\s*co(?:r(?:intios)?)?\b/gi, replacement: 'Segunda Coríntios' },
      { pattern: /\b(1|primeir[oa])\s*ts\b/gi, replacement: 'Primeira Tessalonicenses' },
      { pattern: /\b(2|segund[oa])\s*ts\b/gi, replacement: 'Segunda Tessalonicenses' },
      { pattern: /\b(1|primeir[oa])\s*tm\b/gi, replacement: 'Primeira Timóteo' },
      { pattern: /\b(2|segund[oa])\s*tm\b/gi, replacement: 'Segunda Timóteo' },
      { pattern: /\b(1|primeir[oa])\s*pe(?:d(?:ro)?)?\b/gi, replacement: 'Primeira Pedro' },
      { pattern: /\b(2|segund[oa])\s*pe(?:d(?:ro)?)?\b/gi, replacement: 'Segunda Pedro' },
      { pattern: /\b(1|primeir[oa])\s*jo(?:a(?:o)?)?\b/gi, replacement: 'Primeira João' },
      { pattern: /\b(2|segund[oa])\s*jo(?:a(?:o)?)?\b/gi, replacement: 'Segunda João' },
      { pattern: /\b(3|terceir[oa])\s*jo(?:a(?:o)?)?\b/gi, replacement: 'Terceira João' },
      { pattern: /\b(1|primeir[oa])\s*sm\b/gi, replacement: 'Primeiro Samuel' },
      { pattern: /\b(2|segund[oa])\s*sm\b/gi, replacement: 'Segundo Samuel' },
      { pattern: /\b(1|primeir[oa])\s*rs\b/gi, replacement: 'Primeiro Reis' },
      { pattern: /\b(2|segund[oa])\s*rs\b/gi, replacement: 'Segundo Reis' },
      { pattern: /\b(1|primeir[oa])\s*cr\b/gi, replacement: 'Primeiro Crônicas' },
      { pattern: /\b(2|segund[oa])\s*cr\b/gi, replacement: 'Segundo Crônicas' },
      { pattern: /\bgn\b/gi, replacement: 'Gênesis' },
      { pattern: /\bex\b/gi, replacement: 'Êxodo' },
      { pattern: /\blv\b/gi, replacement: 'Levítico' },
      { pattern: /\bnm\b/gi, replacement: 'Números' },
      { pattern: /\bdt\b/gi, replacement: 'Deuteronômio' },
      { pattern: /\bsl\b/gi, replacement: 'Salmos' },
      { pattern: /\bpv\b/gi, replacement: 'Provérbios' },
      { pattern: /\bec\b/gi, replacement: 'Eclesiastes' },
      { pattern: /\bct\b/gi, replacement: 'Cânticos' },
      { pattern: /\bis\b/gi, replacement: 'Isaías' },
      { pattern: /\bjr\b/gi, replacement: 'Jeremias' },
      { pattern: /\blm\b/gi, replacement: 'Lamentações' },
      { pattern: /\bez\b/gi, replacement: 'Ezequiel' },
      { pattern: /\bdn\b/gi, replacement: 'Daniel' },
      { pattern: /\bos\b/gi, replacement: 'Oséias' },
      { pattern: /\bjl\b/gi, replacement: 'Joel' },
      { pattern: /\bam\b/gi, replacement: 'Amós' },
      { pattern: /\bjn\b/gi, replacement: 'Jonas' },
      { pattern: /\bmq\b/gi, replacement: 'Miquéias' },
      { pattern: /\bmt\b/gi, replacement: 'Mateus' },
      { pattern: /\bmc\b/gi, replacement: 'Marcos' },
      { pattern: /\blc\b/gi, replacement: 'Lucas' },
      { pattern: /\bat\b/gi, replacement: 'Atos' },
      { pattern: /\brm\b/gi, replacement: 'Romanos' },
      { pattern: /\bgl\b/gi, replacement: 'Gálatas' },
      { pattern: /\bef\b/gi, replacement: 'Efésios' },
      { pattern: /\bfp\b/gi, replacement: 'Filipenses' },
      { pattern: /\bcl\b/gi, replacement: 'Colossenses' },
      { pattern: /\btt\b/gi, replacement: 'Tito' },
      { pattern: /\bfm\b/gi, replacement: 'Filemom' },
      { pattern: /\bhb\b/gi, replacement: 'Hebreus' },
      { pattern: /\btg\b/gi, replacement: 'Tiago' },
      { pattern: /\bjd\b/gi, replacement: 'Judas' },
      { pattern: /\bap\b/gi, replacement: 'Apocalipse' }
    ];

    for (const { pattern, replacement } of abbrMap) {
      normalized = normalized.replace(pattern, replacement);
    }

    // 3. Expande prefixos "1 [Livro]" e "2 [Livro]" para pronúncia natural
    normalized = normalized.replace(/\b1\s+([A-Za-zÀ-ÿ]+)/g, (match, book) => {
      const b = book.toLowerCase();
      if (['pedro', 'timóteo', 'timoteo', 'samuel', 'reis', 'crônicas', 'cronicas'].some(x => b.startsWith(x))) {
        return `Primeiro ${book}`;
      }
      return `Primeira ${book}`;
    });

    normalized = normalized.replace(/\b2\s+([A-Za-zÀ-ÿ]+)/g, (match, book) => {
      const b = book.toLowerCase();
      if (['pedro', 'timóteo', 'timoteo', 'samuel', 'reis', 'crônicas', 'cronicas'].some(x => b.startsWith(x))) {
        return `Segundo ${book}`;
      }
      return `Segunda ${book}`;
    });

    // 4. Converte citações bíblicas "Livro X:Y" ou "Livro X:Y-Z" para fala fluida humana
    normalized = normalized.replace(
      /\b([A-Za-zÀ-ÿ]+)\s+(\d+)[:.](\d+)(?:\s*[-–aoe]+\s*(\d+))?\b/g,
      (match, book, cap, vStart, vEnd) => {
        if (vEnd) {
          return `${book}, capítulo ${cap}, versículos ${vStart} a ${vEnd}. `;
        }
        return `${book}, capítulo ${cap}, versículo ${vStart}. `;
      }
    );

    // 5. Se sobrar formato número:número isolado, traduz para capítulo e versículo
    normalized = normalized.replace(/\b(\d+)[:.](\d+)\b/g, 'capítulo $1, versículo $2. ');

    // 6. Limpa aspas e caracteres gráficos que causam tropeços mecânicos
    normalized = normalized.replace(/["“”«»#*_~`]/g, '');

    // 7. Normaliza pausas e respirações humanas: vírgula e ponto com espaçamento natural
    normalized = normalized.replace(/\s*,\s*/g, ', ');
    normalized = normalized.replace(/\s*\.\s*/g, '. ');
    normalized = normalized.replace(/\s*;\s*/g, ', ');
    normalized = normalized.replace(/\s*:\s*/g, ', ');
    normalized = normalized.replace(/[ \t]+/g, ' ').trim();

    return normalized;
  }

  /**
   * Identifica a melhor voz neural / de alta fidelidade em Português do Brasil (pt-BR).
   * Prioriza vozes com modelos neurais e naturais do Google Speech Services (ex: pt-br-x-afs, pt-br-x-ptd),
   * descartando rigorosamente o sintetizador mecânico antigo 'pt-br-language' (Google Translate antigo).
   */
  static async getBestLocalVoiceAsync(): Promise<string | undefined> {
    if (this.cachedVoiceId) return this.cachedVoiceId;

    try {
      let voices = await Speech.getAvailableVoicesAsync();
      // Se o engine TTS ainda estiver em inicialização assíncrona, aguarda 400ms e tenta novamente
      if (!voices || voices.length === 0) {
        await new Promise(r => setTimeout(r, 400));
        voices = await Speech.getAvailableVoicesAsync();
      }

      if (!voices || voices.length === 0) return undefined;

      // 1. Filtra estritamente por Português do Brasil
      const ptBrVoices = voices.filter(v => {
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

      if (ptBrVoices.length === 0) {
        const generalPt = voices.filter(v => {
          const lang = (v.language || '').toLowerCase().replace('_', '-');
          return lang.startsWith('pt') && !lang.includes('pt-pt');
        });
        if (generalPt.length > 0) {
          this.cachedVoiceId = generalPt[0].identifier;
          return this.cachedVoiceId;
        }
        return undefined;
      }

      // 2. Classificação por naturalidade humana:
      // Elimina o sintetizador robótico legado ('pt-br-language' / Pico / SMT)
      // e promove os modelos Neurais WaveNet do Google Speech Services ('afs', 'ptd', 'pte')
      const ranked = [...ptBrVoices].sort((a, b) => {
        const score = (v: typeof a) => {
          const id = (v.identifier || '').toLowerCase();
          const name = (v.name || '').toLowerCase();
          const qual = (v.quality || '').toString().toLowerCase();

          let pts = 0;
          // Penalização severa da voz robótica antiga do Google Tradutor de 2010 e sintetizadores metálicos
          if (id === 'pt-br-language' || id.endsWith('-language') || id.includes('pt_br_lang')) pts -= 500;
          if (id.includes('pico') || name.includes('pico') || id.includes('espeak') || id.includes('smt')) pts -= 500;

          // Vozes confirmadas como expressivas e mais humanas no aparelho:
          if (id.includes('pte') || name.includes('pte')) pts += 350;
          if (id.includes('yif') || name.includes('yif')) pts += 300;
          if (id.includes('jab') || name.includes('jab')) pts += 120;

          // Vozes 'afs' e 'ptd' que soam mecânicas / como tradutor antigo no aparelho:
          if (id.includes('afs') || name.includes('afs')) pts -= 150;
          if (id.includes('ptd') || name.includes('ptd')) pts -= 150;

          if (qual.includes('enhanced') || qual.includes('high') || qual === 'enhanced') pts += 30;
          if (id.includes('google') || name.includes('google')) pts += 20;
          return pts;
        };

        return score(b) - score(a);
      });

      const best = ranked[0];
      if (best) {
        this.cachedVoiceId = best.identifier;
        return this.cachedVoiceId;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  static setUserPreferredVoice(voiceId: string): void {
    this.cachedVoiceId = voiceId;
  }

  static async getAvailablePtBrVoices(): Promise<HumanFriendlyVoice[]> {
    try {
      let voices = await Speech.getAvailableVoicesAsync();
      if (!voices || voices.length === 0) {
        await new Promise(r => setTimeout(r, 400));
        voices = await Speech.getAvailableVoicesAsync();
      }
      if (!voices) return [];

      const ptBr = voices.filter(v => {
        const lang = (v.language || '').toLowerCase().replace('_', '-');
        const id = (v.identifier || '').toLowerCase();
        return (
          lang === 'pt-br' ||
          lang.startsWith('pt-br') ||
          id.includes('pt-br') ||
          id.includes('pt_br') ||
          id.includes('por-bra')
        );
      });

      const friendly = ptBr.map(v =>
        this.formatFriendlyVoice(v.identifier, v.name, v.quality?.toString())
      );

      // Ordena colocando modelos neurais/recomendados primeiro
      return friendly.sort((a, b) => {
        if (a.isRecommended && !b.isRecommended) return -1;
        if (!a.isRecommended && b.isRecommended) return 1;
        return a.displayName.localeCompare(b.displayName);
      });
    } catch {
      return [];
    }
  }

  static async getBestVoiceForLanguageAsync(langCode: string = 'pt-BR'): Promise<string | undefined> {
    const clean = (langCode || 'pt-BR').toLowerCase();
    const isEn = clean.startsWith('en');
    const isEs = clean.startsWith('es');
    const isFr = clean.startsWith('fr');

    if (!isEn && !isEs && !isFr) {
      return this.getBestLocalVoiceAsync();
    }

    try {
      let voices = await Speech.getAvailableVoicesAsync();
      if (!voices || voices.length === 0) {
        await new Promise(r => setTimeout(r, 300));
        voices = await Speech.getAvailableVoicesAsync();
      }
      if (!voices || voices.length === 0) return undefined;

      const prefix = isEn ? 'en' : isEs ? 'es' : isFr ? 'fr' : 'pt';
      const targetVoices = voices.filter(v => {
        const vLang = (v.language || '').toLowerCase().replace('_', '-');
        return vLang.startsWith(prefix);
      });

      if (targetVoices.length === 0) {
        return undefined;
      }

      // Procura por vozes aprimoradas / neurais para o idioma
      const neural = targetVoices.find(v => {
        const id = (v.identifier || '').toLowerCase();
        const qual = (v.quality || '').toString().toLowerCase();
        return qual.includes('enhanced') || id.includes('neural') || id.includes('natural');
      });

      return neural ? neural.identifier : targetVoices[0].identifier;
    } catch {
      return undefined;
    }
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

    if (this.isSpeakingNow) {
      await this.stop();
    }

    this.isSpeakingNow = true;

    // 1. Identifica o idioma correto (passado por parâmetro ou detectado do texto)
    const activeLang = options?.language || this.detectTextLanguage(text);

    // 2. Aplica a camada de pré-processamento fonético bíblico no idioma correto
    const cleanSpokenText = this.normalizeForSpeech(text, activeLang);

    // 3. Identifica melhor voz neural para aquele idioma específico
    let preferredVoice = options?.voice;
    if (!preferredVoice) {
      preferredVoice = await this.getBestVoiceForLanguageAsync(activeLang);
    }

    // 4. Cadência natural humana para leitura bíblica (rate 0.94, pitch 1.0)
    Speech.speak(cleanSpokenText, {
      language: activeLang,
      rate: options?.rate ?? 0.94,
      pitch: options?.pitch ?? 1.0,
      voice: preferredVoice,
      onStart: () => {
        this.isSpeakingNow = true;
        options?.onStart?.();
      },
      onDone: () => {
        this.isSpeakingNow = false;
        options?.onDone?.();
      },
      onStopped: () => {
        this.isSpeakingNow = false;
        options?.onDone?.();
      },
      onError: () => {
        this.isSpeakingNow = false;
        options?.onDone?.();
      }
    });
  }

  static async stop(): Promise<void> {
    try {
      await Speech.stop();
    } catch {
      // Ignorar erros caso Speech não estivesse ativo
    } finally {
      this.isSpeakingNow = false;
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
