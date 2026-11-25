/**
 * Motor de Pontuação Automática e Respiração Natural 100% Offline (Unicode-safe).
 *
 * Resolve dois problemas críticos de reconhecimento de voz no Android:
 * 1. Durante a gravação ao vivo (TranscriptionService / useVoiceDictation): adiciona capitalização,
 *    vírgulas naturais em conjunções/vocativos e ponto final (ou ? / !) a cada pausa de fala.
 * 2. Durante a leitura em voz alta (TTSService): garante pausas de respiração mesmo em textos
 *    antigos salvos sem pontuação no SQLite e divide sermões longos em frases para respiração real.
 */

const LETTER_CLASS = 'A-Za-zÀ-ÖØ-öø-ÿ';

// Palavras que NUNCA devem ter vírgula imediatamente DEPOIS delas (artigos, preposições, pronomes ligados)
const NO_BREAK_AFTER: Record<string, Set<string>> = {
  pt: new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
    'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
    'por', 'pelo', 'pela', 'pelos', 'pelas', 'para', 'pra', 'pro',
    'com', 'sem', 'sob', 'sobre', 'entre', 'até', 'desde', 'contra', 'perante',
    'à', 'às', 'ao', 'aos', 'que', 'e', 'ou', 'se', 'nem', 'mas', 'como', 'quando', 'onde',
    'seu', 'sua', 'seus', 'suas', 'meu', 'minha', 'meus', 'minhas',
    'nosso', 'nossa', 'nossos', 'nossas', 'teu', 'tua', 'teus', 'tuas',
    'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas',
    'aquele', 'aquela', 'aqueles', 'aquelas', 'todo', 'toda', 'todos', 'todas',
    'cada', 'qual', 'quais', 'quem', 'cujo', 'cuja',
    'não', 'muito', 'muita', 'mais', 'menos', 'tão', 'bem', 'mal',
    'é', 'são', 'era', 'foi', 'vai', 'vão', 'está', 'estão', 'ser', 'estar', 'ter', 'há',
    'capítulo', 'capitulo', 'versículo', 'versiculo', 'livro', 'salmo', 'salmos', 'são', 'santo', 'santa',
    'primeiro', 'primeira', 'segundo', 'segunda', 'terceiro', 'terceira'
  ]),
  en: new Set([
    'the', 'a', 'an', 'of', 'to', 'in', 'for', 'with', 'on', 'at', 'from', 'by', 'about', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'without',
    'and', 'or', 'nor', 'but', 'if', 'that', 'which', 'who', 'whom', 'whose', 'when', 'where',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'not',
    'chapter', 'verse', 'book', 'first', 'second', 'third'
  ]),
  es: new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'de', 'del', 'en', 'por', 'para', 'con', 'sin', 'sobre', 'entre', 'hasta', 'desde', 'hacia', 'contra',
    'a', 'al', 'que', 'y', 'e', 'o', 'u', 'si', 'ni', 'pero', 'como', 'cuando', 'donde',
    'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'nuestro', 'nuestra', 'este', 'esta', 'ese', 'esa',
    'no', 'muy', 'más', 'menos', 'tan', 'es', 'son', 'fue', 'era', 'está', 'están',
    'capítulo', 'versículo', 'libro', 'san', 'santo', 'santa'
  ]),
  fr: new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'au', 'aux',
    'en', 'dans', 'par', 'pour', 'avec', 'sans', 'sur', 'sous', 'entre', 'vers', 'chez',
    'à', 'et', 'ou', 'ni', 'mais', 'si', 'que', 'qui', 'dont', 'où', 'comme', 'quand',
    'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs',
    'ce', 'cet', 'cette', 'ces', 'ne', 'pas', 'très', 'plus', 'moins', 'est', 'sont', 'était',
    'chapitre', 'verset', 'livre'
  ])
};

// Conectores naturais de oração (inserir vírgula ANTES quando já houver >= minWords palavras sem pontuação)
const CLAUSE_BREAK_WORDS: Record<string, { strong: Set<string>; soft: Set<string>; multiWord: string[] }> = {
  pt: {
    strong: new Set(['mas', 'porém', 'porem', 'contudo', 'todavia', 'entretanto', 'portanto', 'porque', 'pois', 'embora', 'enquanto']),
    soft: new Set(['então', 'entao', 'quando', 'assim', 'onde', 'como', 'para', 'e']),
    multiWord: [
      'por isso', 'além disso', 'alem disso', 'ou seja', 'isto é', 'isto e',
      'no entanto', 'para que', 'a fim de que', 'ainda que', 'mesmo que',
      'já que', 'ja que', 'visto que', 'por outro lado', 'de modo que'
    ]
  },
  en: {
    strong: new Set(['but', 'however', 'therefore', 'because', 'although', 'though', 'whereas', 'meanwhile', 'furthermore', 'moreover']),
    soft: new Set(['then', 'when', 'while', 'where', 'so', 'and']),
    multiWord: ['so that', 'in order to', 'for example', 'that is', 'on the other hand', 'as well as']
  },
  es: {
    strong: new Set(['pero', 'aunque', 'porque', 'mientras', 'entonces', 'además', 'ademas']),
    soft: new Set(['cuando', 'donde', 'como', 'para', 'y']),
    multiWord: ['sin embargo', 'por lo tanto', 'por eso', 'es decir', 'para que', 'ya que']
  },
  fr: {
    strong: new Set(['mais', 'cependant', 'pourtant', 'donc', 'car', 'alors', 'tandis']),
    soft: new Set(['quand', 'lorsque', 'comme', 'pour', 'et']),
    multiWord: ['parce que', 'bien que', 'en outre', 'afin que', 'tandis que', 'par conséquent']
  }
};

function getShortLang(lang: string = 'pt-BR'): 'pt' | 'en' | 'es' | 'fr' {
  const c = (lang || 'pt').toLowerCase().split('-')[0].split('_')[0];
  if (c === 'en' || c === 'es' || c === 'fr') return c;
  return 'pt';
}

function stripWordPunct(w: string): string {
  return w.toLowerCase().replace(new RegExp(`[^${LETTER_CLASS}0-9]`, 'g'), '');
}

function endsWithPunct(w: string): boolean {
  return /[.!?,;:…]$/.test(w);
}

function capitalizeFirst(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function detectTerminalPunctuation(text: string, lang: 'pt' | 'en' | 'es' | 'fr'): '.' | '?' | '!' {
  const lower = text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.!?,;:]+$/g, '')
    .trim();

  if (!lower) return '.';

  // 1. Exclamações litúrgicas naturais
  const exclEndings =
    lang === 'en'
      ? [/\bamen$/, /\bhallelujah$/, /\bpraise god$/, /\bpraise the lord$/, /\bglory to god$/]
      : lang === 'es'
      ? [/(?:^|[^a-zà-öø-ÿ])am[eé]n$/, /(?:^|[^a-zà-öø-ÿ])aleluya$/, /(?:^|[^a-zà-öø-ÿ])gloria a dios$/]
      : lang === 'fr'
      ? [/(?:^|[^a-zà-öø-ÿ])amen$/, /(?:^|[^a-zà-öø-ÿ])all[eé]luia$/, /(?:^|[^a-zà-öø-ÿ])gloire [àa] dieu$/]
      : [
          /(?:^|[^a-zà-öø-ÿ])am[eé]m$/,
          /(?:^|[^a-zà-öø-ÿ])aleluia$/,
          /(?:^|[^a-zà-öø-ÿ])gl[oó]ria a deus$/,
          /(?:^|[^a-zà-öø-ÿ])louvado seja deus$/
        ];

  if (exclEndings.some(rx => rx.test(lower))) {
    return '!';
  }

  // 2. Perguntas naturais (evitando falsos positivos em afirmações longas com "como" ou "quando")
  const wordCount = lower.split(/\s+/).length;
  const questionPatterns =
    lang === 'en'
      ? [
          /^(why|who|what|where|when|how|do you|did you|are you|is it|have you|can we|will you|shall we)\b/,
          /\b(isn't it|aren't you|don't you|right)$/
        ]
      : lang === 'es'
      ? [
          /^(por qu[eé]|qui[eé]n|qu[eé] es|d[oó]nde est[aá]|cu[aá]ndo|c[oó]mo podemos|acaso)\b/,
          /(?:^|[^a-zà-öø-ÿ])(verdad|no es as[ií])$/
        ]
      : lang === 'fr'
      ? [
          /^(pourquoi|est-ce que|qui est|qu'est-ce que|o[uù] est|comment pouvons)\b/,
          /(?:^|[^a-zà-öø-ÿ])(n'est-ce pas)$/
        ]
      : [
          /^(ser[aá] que|por qu[eê]|voc[eê] j[aá]|voc[eê]s j[aá]|voc[eê] sabe|voc[eê]s sabem|voc[eê] cr[eê]|quem [eé]|quem pode|o que [eé]|o que deus|qual [eé]|onde est[aá]|como podemos|quantas vezes)(?:[^a-zà-öø-ÿ]|$)/,
          /(?:^|[^a-zà-öø-ÿ])(n[aã]o [eé] verdade|n[aã]o [eé] mesmo|entendeu|concorda)$/
        ];

  if (wordCount <= 22 && questionPatterns.some(rx => rx.test(lower))) {
    return '?';
  }

  return '.';
}

/**
 * Insere vírgulas naturais de respiração em uma sequência de palavras sem pontuação excessivamente longa.
 * Preserva 100% intactas as referências bíblicas e evita vírgulas após artigos/preposições.
 */
function insertNaturalCommas(text: string, lang: 'pt' | 'en' | 'es' | 'fr'): string {
  let result = text.normalize('NFC').trim();
  if (!result) return '';

  // 1. Vocativos e saudações comuns de culto em Português (sem quebrar se já pontuado)
  if (lang === 'pt') {
    result = result.replace(
      /^(boa noite|bom dia|boa tarde|a paz do senhor|paz do senhor)\s+(meus\s+irm[aã]os|irm[aã]os|amados|igreja|povo de deus)(?=\s+[A-Za-zÀ-ÖØ-öø-ÿ])/gi,
      '$1, $2,'
    );
    result = result.replace(
      /^(boa noite|bom dia|boa tarde|a paz do senhor|paz do senhor)\s+(meus\s+irm[aã]os|irm[aã]os|amados|igreja|povo de deus)$/gi,
      '$1, $2'
    );
    // Pausa natural antes de "amém" / "aleluia" no final de uma frase mais longa
    result = result.replace(
      /([A-Za-zÀ-ÖØ-öø-ÿ]{3,})\s+(am[eé]m|aleluia)([.!?]*)$/gi,
      (match, prevWord, excl, endP) => {
        if (NO_BREAK_AFTER.pt.has(prevWord.toLowerCase())) return match;
        return `${prevWord}, ${excl}${endP}`;
      }
    );
  }

  // 2. Conectores compostos (ex: "por isso", "além disso", "para que", "sin embargo", "so that")
  const rules = CLAUSE_BREAK_WORDS[lang] || CLAUSE_BREAK_WORDS.pt;
  const noBreakSet = NO_BREAK_AFTER[lang] || NO_BREAK_AFTER.pt;

  for (const phrase of rules.multiWord) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const rx = new RegExp(`([^.!?,;:\\n]{18,}?[${LETTER_CLASS}0-9])\\s+(${escaped})(?=$|[^${LETTER_CLASS}])`, 'gi');
    result = result.replace(rx, (match, before, conn) => {
      const beforeWords = before.trim().split(/\s+/);
      const lastPrevWord = stripWordPunct(beforeWords[beforeWords.length - 1] || '');
      if (beforeWords.length < 4 || noBreakSet.has(lastPrevWord)) {
        return match;
      }
      return `${before}, ${conn}`;
    });
  }

  // 3. Passagem palavra por palavra para conjunções simples e pausa de respiração em frases muito longas
  const words = result.split(/\s+/);
  if (words.length < 6) {
    return result;
  }

  let wordsSincePunct = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const cleanW = stripWordPunct(w);
    const prevWord = i > 0 ? words[i - 1] : '';
    const cleanPrev = stripWordPunct(prevWord);
    const prevHasPunct = i > 0 && endsWithPunct(prevWord);
    const isNumber = /^\d/.test(cleanW);

    if (prevHasPunct) {
      wordsSincePunct = 0;
    }

    const prevIsBareNumber = /^\d+$/.test(prevWord);
    const canPlaceCommaBeforeCurrent =
      i >= 4 &&
      i < words.length - 1 &&
      !prevHasPunct &&
      !noBreakSet.has(cleanPrev) &&
      !isNumber && // Nunca separa nome do livro do número do capítulo (ex: "João 3:16", "Salmos 23")
      (!prevIsBareNumber || rules.strong.has(cleanW));

    // 3a. Conjunção forte após >= 4 palavras sem pausa (ex: "mas", "porém", "porque", "contudo")
    if (canPlaceCommaBeforeCurrent && wordsSincePunct >= 4 && rules.strong.has(cleanW)) {
      words[i - 1] = `${prevWord},`;
      wordsSincePunct = 1;
      continue;
    }

    // 3b. Conector suave após >= 9 palavras sem pausa (ex: ", e ", ", então ", ", quando ", ", para ")
    if (canPlaceCommaBeforeCurrent && wordsSincePunct >= 9 && rules.soft.has(cleanW)) {
      words[i - 1] = `${prevWord},`;
      wordsSincePunct = 1;
      continue;
    }

    // 3c. Rede de segurança para blocos gigantes sem nenhuma pontuação (>= 15 palavras seguidas):
    // Insere uma pausa suave no primeiro ponto seguro para o sintetizador TTS respirar!
    if (canPlaceCommaBeforeCurrent && wordsSincePunct >= 15 && !noBreakSet.has(cleanW)) {
      words[i - 1] = `${prevWord},`;
      wordsSincePunct = 1;
      continue;
    }

    wordsSincePunct++;
    if (endsWithPunct(w)) {
      wordsSincePunct = 0;
    }
  }

  return words
    .join(' ')
    .replace(/,\s*,+/g, ',')
    .replace(/\s+,/g, ',')
    .replace(/,\s*([.!?])/g, '$1')
    .trim();
}

export class SmartPunctuation {
  /**
   * Formata e pontua uma fala consolidada vinda do reconhecimento de voz (microfone).
   * Adiciona capitalização, vírgulas naturais e pontuação final (., ?, !).
   */
  static punctuateUtterance(rawText: string, lang: string = 'pt-BR'): string {
    const clean = (rawText || '').normalize('NFC').replace(/\s+/g, ' ').trim();
    if (!clean) return '';

    const shortLang = getShortLang(lang);
    let formatted = insertNaturalCommas(clean, shortLang);
    formatted = capitalizeFirst(formatted);

    // Se já termina com pontuação final, mantém; se termina com vírgula solta, troca pelo sinal final
    if (/[.!?]$/.test(formatted)) {
      return formatted;
    }
    formatted = formatted.replace(/[,;:]+$/, '').trim();
    if (!formatted) return '';

    const endPunct = detectTerminalPunctuation(formatted, shortLang);
    return `${formatted}${endPunct}`;
  }

  /**
   * Garante pausas de respiração em textos longos antes da leitura por voz (TTS).
   * - Se o texto JÁ possui boa pontuação (ex: Bíblia ou textos editados), preserva 100% original.
   * - Se existir qualquer trecho contínuo muito longo (> 16 palavras) sem pontuação (ex: gravações
   *   antigas ou falas corridas), aplica vírgulas e pontos de respiração apenas naquele trecho.
   */
  static ensureReadableBreathing(text: string, lang: string = 'pt-BR'): string {
    const clean = (text || '').normalize('NFC').trim();
    if (!clean) return '';

    const shortLang = getShortLang(lang);

    // Separa por quebras de linha ou pontuações finais já existentes para preservar textos bem pontuados
    const sentences = clean.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [clean];
    const processed = sentences.map((segment) => {
      const seg = segment.trim();
      if (!seg) return '';

      // Checa o maior trecho consecutivo sem nenhuma pontuação (.,!?;:)
      const subClauses = seg.split(/[.!?,;:]+/);
      const maxUnpunctuatedWords = subClauses.reduce((max, part) => {
        const count = part.trim().split(/\s+/).filter(Boolean).length;
        return Math.max(max, count);
      }, 0);

      // Se todas as cláusulas já têm <= 16 palavras, mantém intacto!
      if (maxUnpunctuatedWords <= 16) {
        return seg;
      }

      // Caso contrário, aplica pontuação de respiração natural nesse trecho corrido
      let breathed = insertNaturalCommas(seg, shortLang);

      // Se ainda for um bloco imenso sem ponto final (ex: culto inteiro gravado antes desta correção),
      // promove a cada 3 vírgulas uma pausa de frase (ponto final) para o TTS respirar profundamente
      const hasSentenceBreak = /[.!?]/.test(breathed.slice(0, -1));
      if (!hasSentenceBreak && breathed.split(/\s+/).length >= 28) {
        let commaCount = 0;
        breathed = breathed.replace(/,\s+([A-Za-zÀ-ÖØ-öø-ÿ])/g, (match, nextLetter) => {
          commaCount++;
          if (commaCount % 3 === 0) {
            return `. ${nextLetter.toUpperCase()}`;
          }
          return match;
        });
      }

      return breathed;
    });

    return processed.filter(Boolean).join(' ');
  }

  /**
   * Divide textos longos em blocos de sentenças com pausa de respiração real para o sintetizador TTS,
   * respeitando o limite máximo por chamada do Android TextToSpeech (evita cortes em textos longos).
   */
  static splitForBreathingTTS(
    text: string,
    maxChunkChars: number = 280
  ): { text: string; pauseAfterMs: number }[] {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return [];

    // Caso curto (ex: um único versículo ou frase curta): envia direto sem dividir
    if (clean.length <= maxChunkChars && !/[.!?]\s+\S/.test(clean)) {
      return [{ text: clean, pauseAfterMs: 0 }];
    }

    // Divide em sentenças preservando o sinal final (. ! ?)
    const rawSentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
    const chunks: { text: string; pauseAfterMs: number }[] = [];

    for (const rawSent of rawSentences) {
      const sent = rawSent.trim();
      if (!sent) continue;

      if (sent.length <= maxChunkChars) {
        chunks.push({ text: sent, pauseAfterMs: 260 });
        continue;
      }

      // Sentença muito longa: fatia suavemente nas vírgulas / ponto-e-vírgula
      const clauses = sent.match(/[^,;]+[,;]+|[^,;]+$/g) || [sent];
      let buffer = '';

      for (const clause of clauses) {
        const c = clause.trim();
        if (!c) continue;

        if (!buffer) {
          buffer = c;
        } else if (buffer.length + 1 + c.length <= maxChunkChars) {
          buffer = `${buffer} ${c}`;
        } else {
          chunks.push({
            text: buffer,
            pauseAfterMs: /[.!?]$/.test(buffer) ? 260 : 140
          });
          buffer = c;
        }
      }

      if (buffer) {
        // Caso ainda exceda maxChunkChars mesmo sem vírgulas, corta por espaço seguro
        while (buffer.length > maxChunkChars) {
          let cut = buffer.lastIndexOf(' ', maxChunkChars);
          if (cut < 80) cut = maxChunkChars;
          chunks.push({ text: buffer.slice(0, cut).trim(), pauseAfterMs: 140 });
          buffer = buffer.slice(cut).trim();
        }
        if (buffer) {
          chunks.push({
            text: buffer,
            pauseAfterMs: /[.!?]$/.test(buffer) ? 260 : 140
          });
        }
      }
    }

    // O último bloco não precisa de pausa após terminar
    if (chunks.length > 0) {
      chunks[chunks.length - 1].pauseAfterMs = 0;
    }

    return chunks;
  }
}
