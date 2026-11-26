/**
 * Utilitário de limpeza, desduplicação acústica e correção fonética bíblica 100% offline.
 *
 * Reduz erros frequentes de captura do microfone em ambientes de igreja (eco, distância do púlpito,
 * reconhecimento offline Android) — ex.: "somos 23" -> "Salmos 23", "1 Corinthians 13" -> "1 Coríntios 13",
 * "ver círculo 4" -> "versículo 4" — preservando intactas frases cotidianas ("nós somos filhos de Deus").
 */

export interface SpeechAlternative {
  transcript: string;
  confidence?: number;
}

/**
 * Termos de viés contextual enviados diretamente ao motor de reconhecimento de voz
 * (Android API 33+ EXTRA_BIASING_STRINGS / iOS contextualStrings) para aumentar a
 * probabilidade acústica de livros bíblicos e termos de culto.
 */
const CONTEXTUAL_STRINGS_BY_LANG: Record<string, string[]> = {
  pt: [
    'Salmos', 'Salmo', 'Gênesis', 'Êxodo', 'Levítico', 'Números', 'Deuteronômio',
    'Josué', 'Juízes', 'Rute', 'Samuel', 'Reis', 'Crônicas', 'Esdras', 'Neemias', 'Ester', 'Jó',
    'Provérbios', 'Eclesiastes', 'Cânticos', 'Isaías', 'Jeremias', 'Lamentações', 'Ezequiel',
    'Daniel', 'Oséias', 'Joel', 'Amós', 'Obadias', 'Jonas', 'Miquéias', 'Naum', 'Habacuque',
    'Sofonias', 'Ageu', 'Zacarias', 'Malaquias',
    'Mateus', 'Marcos', 'Lucas', 'João', 'Atos', 'Romanos', 'Coríntios', 'Gálatas', 'Efésios',
    'Filipenses', 'Colossenses', 'Tessalonicenses', 'Timóteo', 'Tito', 'Filemom', 'Hebreus',
    'Tiago', 'Pedro', 'Judas', 'Apocalipse',
    'capítulo', 'versículo', 'versículos', 'Bíblia', 'Evangelho', 'Aleluia', 'Amém', 'Senhor'
  ],
  en: [
    'Psalms', 'Psalm', 'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Samuel', 'Chronicles', 'Nehemiah', 'Proverbs', 'Ecclesiastes',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Hosea', 'Habakkuk', 'Zephaniah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', 'Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', 'Thessalonians', 'Timothy', 'Philemon', 'Hebrews', 'James',
    'Peter', 'Revelation', 'chapter', 'verse', 'verses', 'Bible', 'Gospel', 'Hallelujah', 'Amen'
  ],
  es: [
    'Salmos', 'Salmo', 'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio',
    'Josué', 'Jueces', 'Crónicas', 'Nehemías', 'Proverbios', 'Eclesiastés', 'Isaías',
    'Jeremías', 'Ezequiel', 'Oseas', 'Habacuc', 'Sofonías', 'Malaquías',
    'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos', 'Romanos', 'Corintios', 'Gálatas',
    'Efesios', 'Filipenses', 'Colosenses', 'Tesalonicenses', 'Timoteo', 'Hebreos',
    'Santiago', 'Pedro', 'Apocalipsis', 'capítulo', 'versículo', 'versículos', 'Biblia', 'Amén'
  ],
  fr: [
    'Psaumes', 'Psaume', 'Genèse', 'Exode', 'Lévitique', 'Nombres', 'Deutéronome',
    'Proverbes', 'Ecclésiaste', 'Ésaïe', 'Jérémie', 'Ézéchiel', 'Matthieu', 'Marc', 'Luc', 'Jean',
    'Actes', 'Romains', 'Corinthiens', 'Galates', 'Éphésiens', 'Philippiens', 'Colossiens',
    'Thessaloniciens', 'Timothée', 'Hébreux', 'Jacques', 'Pierre', 'Apocalypse',
    'chapitre', 'verset', 'versets', 'Bible', 'Alléluia', 'Amen'
  ]
};

export function getBiblicalContextualStrings(locale: string = 'pt-BR'): string[] {
  const lang = (locale || 'pt').split('-')[0].toLowerCase();
  return CONTEXTUAL_STRINGS_BY_LANG[lang] || CONTEXTUAL_STRINGS_BY_LANG.pt;
}

// Palavras-chave fortes de referência bíblica para ranquear hipóteses do reconhecedor (maxAlternatives)
const BIBLICAL_SIGNAL_REGEX =
  /\b(salmos?|g[eê]nesis|[eê]xodo|lev[ií]tico|n[uú]meros|deuteron[oô]mio|josu[eé]|ju[ií]zes|rute|samuel|reis|cr[oô]nicas|esdras|neemias|ester|prov[eé]rbios|eclesiastes|c[aâ]nticos|isa[ií]as|jeremias|lamenta[cç][oõ]es|ezequiel|daniel|os[eé]ias|joel|am[oó]s|obadias|jonas|miqu[eé]ias|naum|habacuque|sofonias|ageu|zacarias|malaquias|mateus|marcos|lucas|jo[aã]o|atos|romanos|cor[ií]ntios|g[aá]latas|ef[eé]sios|filipenses|colossenses|tessalonicenses|tim[oó]teo|tito|filemom|hebreus|tiago|pedro|judas|apocalipse|psalms?|genesis|exodus|proverbs|matthew|romans|corinthians|philippians|hebrews|revelation|cap[ií]tulo|vers[ií]culos?|chapter|verses?|psaumes?|chapitre|versets?)\b/gi;

// Palavras que quase sempre indicam erro fonético quando competem com um livro bíblico em outra alternativa
const LIKELY_MISHEARD_REGEX =
  /\b(somos|samos|samo|salvos?|saumos?|palmos|calmos|corinthians|ver\s+c[ií]rculo|ver\s+s[eé]culo|g[eê]neros|g[eê]nese|[eê]xito|felipenses|colocenses|tesalonicenses)\b/i;

function scoreAlternative(transcript: string, isPrimary: boolean, confidence?: number): number {
  const text = (transcript || '').trim();
  if (!text) return -999;

  let score = isPrimary ? 1.0 : 0;
  if (typeof confidence === 'number' && confidence > 0) {
    score += confidence;
  }

  const biblicalMatches = text.match(BIBLICAL_SIGNAL_REGEX);
  if (biblicalMatches && biblicalMatches.length > 0) {
    // Bônus alto se contém livro/termo bíblico real
    score += 3.0 * Math.min(biblicalMatches.length, 3);
    // Bônus extra se também contém dígitos ou números falados (típico de citação bíblica)
    if (/\b\d{1,3}\b/.test(text) || /\b(um|dois|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|vinte|trinta|noventa|cento)\b/i.test(text)) {
      score += 2.0;
    }
  }

  // Penalidade leve se tem candidato forte a confusão fonética junto de número
  if (LIKELY_MISHEARD_REGEX.test(text) && /\d/.test(text)) {
    score -= 1.5;
  }

  return score;
}

/**
 * Seleciona a melhor hipótese entre as alternativas retornadas pelo SpeechRecognizer (maxAlternatives).
 * Exemplo: se results[0] = "somos 23" e results[1] = "Salmos 23", promove automaticamente "Salmos 23".
 */
export function selectBestTranscript(
  results: SpeechAlternative[] | undefined | null,
  locale: string = 'pt-BR'
): string {
  if (!results || results.length === 0) return '';

  const valid = results.filter(r => r && typeof r.transcript === 'string' && r.transcript.trim().length > 0);
  if (valid.length === 0) return '';

  if (valid.length === 1) {
    return sanitizeSpeechChunk(valid[0].transcript, locale);
  }

  const primary = valid[0];
  let best = primary;
  let bestScore = scoreAlternative(primary.transcript, true, primary.confidence);

  for (let i = 1; i < valid.length; i++) {
    const candidate = valid[i];
    // Só troca a hipótese principal se a alternativa tiver sinal bíblico real e tamanho compatível
    const lenRatio = candidate.transcript.trim().length / Math.max(1, primary.transcript.trim().length);
    if (lenRatio < 0.65 || lenRatio > 1.45) continue;

    const candScore = scoreAlternative(candidate.transcript, false, candidate.confidence);
    if (candScore > bestScore + 0.5) {
      best = candidate;
      bestScore = candScore;
    }
  }

  return sanitizeSpeechChunk(best.transcript, locale);
}

// Expressão auxiliar de números (dígitos ou por extenso comuns) usados em capítulos/versículos
const NUM_TOKEN =
  '(?:\\d{1,3}|um|uma|primeiro|primeira|dois|duas|segundo|segunda|tr[eê]s|terceiro|terceira|quatro|quarto|cinco|quinto|seis|sexto|sete|s[eé]timo|oito|oitavo|nove|nono|dez|d[eé]cimo|onze|doze|treze|quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento)';

// Substantivos comuns de contagem que indicam que "somos <num>" NÃO é Salmos (ex: "somos 5 pessoas")
const NON_BIBLICAL_FOLLOWERS =
  '(?:por\\s+cento|pessoas?|irm[aã]os?|amigos?|filhos?|filhas?|homens|mulheres|jovens|crian[cç]as|membros?|pastores?|igrejas?|fam[ií]lias?|dias?|anos?|meses|semanas?|horas?|minutos?|segundos?|vezes|reais|mil|milh[oõ]es|aqui|juntos|todos|muitos|poucos)';

// Prefixos inequívocos de citação bíblica em português
const PT_BIBLICAL_INTRO =
  '(?:(?:no|na|em|do|da|dos|pelo|para)\\s+(?:livro\\s+(?:de|dos)?\\s+)?|livro\\s+(?:de|dos)\\s+|(?:abra|abre|abram|abrindo|vamos\\s+(?:abrir|ler|meditar)|leia|ler|lendo|meditar|meditando|texto|passagem|leitura|escrito|diz|est[aá])\\s+(?:(?:no|em|na|o|os|a|de)\\s+)?(?:livro\\s+(?:de|dos)\\s+)?)';

/**
 * Limpa ruídos acústicos e corrige confusões fonéticas de captura de voz em contexto bíblico.
 * Seguro para rodar tanto em tempo real (parciais/finais) quanto no detector de referências.
 */
export function sanitizeSpeechChunk(text: string, locale: string = 'pt-BR'): string {
  if (!text || !text.trim()) return '';

  let cleaned = text
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Limpeza de artefatos de pontuação / espaçamento gerados pelo STT
  cleaned = cleaned
    // "3 : 16" -> "3:16"
    .replace(/(\d+)\s*:\s*(\d+)/g, '$1:$2')
    // Espaço indevido antes de pontuação
    .replace(/\s+([,.;!?])/g, '$1')
    // Pontos ou vírgulas duplicadas
    .replace(/,{2,}/g, ',')
    .replace(/\.{4,}/g, '...');

  // 2. Remove repetições acidentais imediatas causadas por eco de som da igreja
  // Ex: "no no livro", "capítulo capítulo 3", "o o Senhor" (não mexe em "santo santo" ou "amém amém")
  cleaned = cleaned.replace(
    /\b(o|a|os|as|um|uma|de|do|da|dos|das|em|no|na|nos|nas|para|por|que|com|e|se|cap[ií]tulo|vers[ií]culo|vers[ií]culos|livro)\s+\1\b/gi,
    '$1'
  );

  const lang = (locale || 'pt').split('-')[0].toLowerCase();

  if (lang === 'pt' || lang === 'ts') {
    // 3. Correção de "versículo" / "capítulo" quebrados pelo STT offline
    cleaned = cleaned
      .replace(/\bver\s+c[ií]rculos?\b/gi, (m) => (/s$/i.test(m) ? 'versículos' : 'versículo'))
      .replace(/\bver\s+s[eé]culos?\b/gi, (m) => (/s$/i.test(m) ? 'versículos' : 'versículo'))
      .replace(/\bvers[ií]culo\s+s\b/gi, 'versículos')
      .replace(/\bversiculo(s?)\b/gi, 'versículo$1')
      .replace(/\bca\s+p[ií]tulo\b/gi, 'capítulo')
      .replace(/\bcapitulo\b/gi, 'capítulo');

    // 4. "somos" / "samos" / "samo" / "saumos" / "salvos" / "salvo" / "palmos" -> "Salmos" EM CONTEXTO BÍBLICO

    // 4a. "samos" / "samo" / "saumos" / "saumo" não existem em português padrão -> sempre "Salmos" em contexto numérico/bíblico
    cleaned = cleaned.replace(
      new RegExp(`\\b(samos|samo|saumos?|sa[uú]mos?|samus)\\b(?=\\s*(?:,|\\.|cap[ií]tulo|cap\\.?|vers[ií]culos?|verso|${NUM_TOKEN}\\b))`, 'gi'),
      'Salmos'
    );
    cleaned = cleaned.replace(
      new RegExp(`(${PT_BIBLICAL_INTRO})(samos|samo|saumos?|sa[uú]mos?|samus)\\b`, 'gi'),
      '$1Salmos'
    );

    // 4b. "somos" / "salvos" / "salvo" / "palmos" / "calmos" com introdução bíblica inequívoca
    // Ex: "no livro de somos 23", "abra em somos 91", "vamos ler em somos", "em somos capítulo 3"
    cleaned = cleaned.replace(
      new RegExp(`(${PT_BIBLICAL_INTRO})(somos|salvos?|palmos|calmos)\\b(?=\\s*(?:$|[,.;!?]|cap[ií]tulo|cap\\.?|vers[ií]culos?|verso|${NUM_TOKEN}\\b))`, 'gi'),
      '$1Salmos'
    );

    // 4c. "somos" / "salvos" / "salvo" diretamente seguido de capítulo/versículo ou formato Cap:Vers
    // Ex: "somos 23:1", "somos capítulo 3", "somos versículo 4", "somos 30 do 2 ao 4"
    cleaned = cleaned.replace(
      new RegExp(
        `\\b(somos|salvos?|palmos|calmos)\\b(?=\\s*(?:[,;]?\\s*(?:cap[ií]tulo|cap\\.?|vers[ií]culos?|versos?)|\\d{1,3}\\s*:\\s*\\d{1,3}|${NUM_TOKEN}\\s+(?:vers[ií]culos?|versos?|do\\s+${NUM_TOKEN}\\s+(?:ao|a|at[eé])))\\b)`,
        'gi'
      ),
      'Salmos'
    );

    // 4d. "somos <número>" quando NÃO é seguido por "%", dígitos extras ou substantivo de contagem
    // ("somos 5 pessoas", "somos 100%") nem precedido por pronome de 1ª pessoa plural ("nós somos 3")
    // Ex: "Somos 23.", "Hoje vamos ler somos 91", "Somos 119"
    cleaned = cleaned.replace(
      new RegExp(
        `(^|[.!?;:,]\\s+|\\b(?:ler|leia|abrir|abra|abre|meditar|texto|palavra|b[ií]blia|salmos|livro|hoje|agora|tamb[eé]m|e|de|em|no|o|os)\\s+)(somos)(?=\\s+(?:1[0-4]\\d|150|[1-9]\\d?)(?![\\d%])(?!\\s*%)(?!\\s+${NON_BIBLICAL_FOLLOWERS}\\b)(?:\\b|$))`,
        'gi'
      ),
      (match, prefix, word, offset, fullStr) => {
        // Proteção extra: nunca altera se logo antes havia "nós" (ex: "nós somos 2")
        const before = fullStr.slice(Math.max(0, offset - 10), offset).toLowerCase();
        if (/\bn[oó]s\s*$/.test(before)) return match;
        return `${prefix}Salmos`;
      }
    );

    // 5. Outros erros acústicos clássicos de livros bíblicos no STT português
    const phoneticBooks: [RegExp, string][] = [
      // "Corinthians" -> "Coríntios" (muito comum no Google STT PT-BR!)
      [/\b([12]|primeir[oa]|segund[oa])\s+corinthians\b/gi, '$1 Coríntios'],
      [/\bcorinthians\b(?=\s*(?:cap[ií]tulo|cap\.?|vers[ií]culos?|\d{1,2}\b))/gi, 'Coríntios'],
      [/\b([12]|primeir[oa]|segund[oa])\s+cor[ií]ntio\b/gi, '$1 Coríntios'],
      // "gêneros" / "gênese" / "genes" em contexto bíblico -> "Gênesis"
      [new RegExp(`\\b(g[eê]neros?|g[eê]nese|genes)\\b(?=\\s*(?:cap[ií]tulo|cap\\.?|vers[ií]culos?|\\d{1,2}\\s*:\\s*\\d{1,2}|\\d{1,2}\\s+vers[ií]culos?))`, 'gi'), 'Gênesis'],
      [new RegExp(`(${PT_BIBLICAL_INTRO})(g[eê]neros?|g[eê]nese|genes)\\b(?=\\s*(?:cap[ií]tulo|${NUM_TOKEN}\\b))`, 'gi'), '$1Gênesis'],
      // "êxito" em contexto bíblico -> "Êxodo"
      [new RegExp(`\\b([eê]xito|[eê]sodo)\\b(?=\\s*(?:cap[ií]tulo|cap\\.?|vers[ií]culos?|\\d{1,2}\\s*:\\s*\\d{1,2}))`, 'gi'), 'Êxodo'],
      [new RegExp(`(${PT_BIBLICAL_INTRO})([eê]xito|[eê]sodo)\\b(?=\\s*(?:cap[ií]tulo|${NUM_TOKEN}\\b))`, 'gi'), '$1Êxodo'],
      // Pequenas variações ortográficas/fonéticas de livros
      [/\blev[ií]ticos\b(?=\s*(?:cap[ií]tulo|cap\.?|\d))/gi, 'Levítico'],
      [/\bdeu\s+teron[oô]mio\b/gi, 'Deuteronômio'],
      [/\bprov[eé]rbio\b(?=\s*(?:cap[ií]tulo|cap\.?|vers[ií]culos?|\d))/gi, 'Provérbios'],
      [/\beclesiaste\b(?=\s*(?:cap[ií]tulo|cap\.?|\d))/gi, 'Eclesiastes'],
      [/\b(iza[ií]as|isaia)\b(?=\s*(?:cap[ií]tulo|cap\.?|vers[ií]culos?|\d))/gi, 'Isaías'],
      [/\bjeremia\b(?=\s*(?:cap[ií]tulo|cap\.?|\d))/gi, 'Jeremias'],
      [/\b(oz[eé]ias|oseas)\b(?=\s*(?:cap[ií]tulo|cap\.?|\d))/gi, 'Oséias'],
      [/\b(abacuque|habacuc|abacuc)\b/gi, 'Habacuque'],
      [/\bmalaquia\b(?=\s*(?:cap[ií]tulo|cap\.?|\d))/gi, 'Malaquias'],
      [/\b(matheus|mateu)\b(?=\s*(?:cap[ií]tulo|cap\.?|vers[ií]culos?|\d))/gi, 'Mateus'],
      [/\bromano\b(?=\s*(?:cap[ií]tulo|cap\.?|vers[ií]culos?|\d))/gi, 'Romanos'],
      [/\bg[aá]lata\b(?=\s*(?:cap[ií]tulo|cap\.?|vers[ií]culos?|\d))/gi, 'Gálatas'],
      [/\bef[eé]sio\b(?=\s*(?:cap[ií]tulo|cap\.?|vers[ií]culos?|\d))/gi, 'Efésios'],
      [/\b(felipenses?|filipense|filipences?)\b/gi, 'Filipenses'],
      [/\b(colocenses?|colosenses?|colossense)\b/gi, 'Colossenses'],
      [/\b(tesalonicenses?|tessalonicences?|tessalonicense)\b/gi, 'Tessalonicenses'],
      [/\btim[oó]tio\b/gi, 'Timóteo'],
      [/\bhebreu\b(?=\s*(?:cap[ií]tulo|cap\.?|vers[ií]culos?|\d))/gi, 'Hebreus'],
      [/\bthiago\b(?=\s*(?:cap[ií]tulo|cap\.?|vers[ií]culos?|\d))/gi, 'Tiago'],
      [/\b(apocalipsi|apocalipce)\b/gi, 'Apocalipse']
    ];

    for (const [pattern, replacement] of phoneticBooks) {
      cleaned = cleaned.replace(pattern, replacement);
    }
  } else if (lang === 'en') {
    // Inglês: "palms 23" / "sams 23" -> "Psalms 23"
    cleaned = cleaned.replace(
      /\b(palms|sams|songs)\b(?=\s*(?:chapter|verse|\d{1,3}\s*:\s*\d{1,3}|\d{1,3}\s+verse))/gi,
      'Psalms'
    );
  } else if (lang === 'es') {
    // Espanhol: "somos 23" / "salvos 23" -> "Salmos 23"
    cleaned = cleaned.replace(
      /\b(somos|salvos?|samos)\b(?=\s*(?:cap[ií]tulo|vers[ií]culos?|\d{1,3}\s*:\s*\d{1,3}|\d{1,3}\s+vers[ií]culo))/gi,
      'Salmos'
    );
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}
