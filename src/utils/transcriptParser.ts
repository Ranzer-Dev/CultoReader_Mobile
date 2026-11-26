import { DetectedVerse } from '../types';
import { buildVerseRegex } from '../services/bible/BibleReferenceDetector';
import { CANONICAL_BOOKS } from '../services/bible/BibleBooksData';

export interface TextSegment {
  type: 'text' | 'verse';
  content: string;
  verse?: DetectedVerse;
}

interface MatchRange {
  start: number;
  end: number;
  verse: DetectedVerse;
  matchText: string;
}

const segmentsCache = new Map<string, TextSegment[]>();

/**
 * Retorna todos os nomes e abreviações em múltiplos idiomas para um livro bíblico
 */
function getBookMultilingualAliases(bookName: string): string[] {
  const norm = (bookName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const found = CANONICAL_BOOKS.find(b => {
    return Object.values(b.names).some(n =>
      n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() === norm
    ) || b.abbrev.toLowerCase() === norm;
  });

  const aliases = new Set<string>([bookName]);
  if (found) {
    Object.values(found.names).forEach(n => {
      aliases.add(n);
      if (n === 'Salmos') aliases.add('Salmo');
      if (n === 'Psalms') aliases.add('Psalm');
      if (n === 'Psaumes') aliases.add('Psaume');
    });
    aliases.add(found.abbrev);
  } else {
    if (norm === 'salmos' || norm === 'salmo' || norm === 'psalms' || norm === 'psalm') {
      ['Salmos', 'Salmo', 'Psalms', 'Psalm', 'Psaumes', 'Psaume'].forEach(a => aliases.add(a));
    }
  }
  return Array.from(aliases);
}

/**
 * Analisa o texto transcrito e divide em segmentos contínuos de texto comum
 * e trechos identificados como referências bíblicas (hiperlinks clicáveis).
 */
export function parseTranscriptSegments(text: string, verses: DetectedVerse[]): TextSegment[] {
  if (!text) return [];
  if (!verses || verses.length === 0) {
    return [{ type: 'text', content: text }];
  }

  // Cache O(1) livre de colisões para evitar re-parsear strings idênticas
  const verseSig = verses.map(v => `${v.book}:${v.chapter}:${v.verse_start}-${v.verse_end || ''}`).join('|');
  const cacheKey = `${text.length}_${text.slice(0, 40)}_${text.slice(-40)}_${verseSig}`;
  if (segmentsCache.has(cacheKey)) {
    return segmentsCache.get(cacheKey)!;
  }

  const allCandidateMatches: MatchRange[] = [];
  const lowerText = text.toLowerCase();

  for (const v of verses) {
    const bookAliases = getBookMultilingualAliases(v.book);
    const candidates: string[] = [];
    if (v.raw_match) candidates.push(v.raw_match);

    for (const bName of bookAliases) {
      try {
        const re = buildVerseRegex(bName, v.chapter, v.verse_start, v.verse_end);
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
          if (m[0].length === 0) {
            re.lastIndex++;
            continue;
          }
          allCandidateMatches.push({
            start: m.index,
            end: m.index + m[0].length,
            verse: v,
            matchText: text.substring(m.index, m.index + m[0].length)
          });
        }
      } catch {}

      if (v.verse_end) {
        // Português
        candidates.push(`${bName} capítulo ${v.chapter} do versículo ${v.verse_start} ao versículo ${v.verse_end}`);
        candidates.push(`${bName} capítulo ${v.chapter} versículos ${v.verse_start} ao versículo ${v.verse_end}`);
        candidates.push(`${bName} capítulo ${v.chapter} versículos ${v.verse_start} ao ${v.verse_end}`);
        candidates.push(`${bName} capítulo ${v.chapter} versículos ${v.verse_start} a ${v.verse_end}`);
        candidates.push(`${bName} capítulo ${v.chapter} versículo ${v.verse_start} ao ${v.verse_end}`);
        candidates.push(`${bName} ${v.chapter} do ${v.verse_start} ao ${v.verse_end}`);
        candidates.push(`${bName} ${v.chapter} de ${v.verse_start} a ${v.verse_end}`);
        candidates.push(`${bName} ${v.chapter} versículos ${v.verse_start} ao ${v.verse_end}`);
        // Inglês
        candidates.push(`${bName} chapter ${v.chapter} verses ${v.verse_start} to ${v.verse_end}`);
        candidates.push(`${bName} chapter ${v.chapter} verse ${v.verse_start} to ${v.verse_end}`);
        candidates.push(`${bName} chapter ${v.chapter} verses ${v.verse_start}-${v.verse_end}`);
        candidates.push(`${bName} ${v.chapter} verses ${v.verse_start} to ${v.verse_end}`);
        candidates.push(`${bName} ${v.chapter} verses ${v.verse_start}-${v.verse_end}`);
        candidates.push(`${bName} ${v.chapter} verse ${v.verse_start} to ${v.verse_end}`);
        // Espanhol
        candidates.push(`${bName} capítulo ${v.chapter} versículos ${v.verse_start} al ${v.verse_end}`);
        candidates.push(`${bName} ${v.chapter} del ${v.verse_start} al ${v.verse_end}`);
        // Numérico
        candidates.push(`${bName} ${v.chapter}:${v.verse_start}-${v.verse_end}`);
        candidates.push(`${bName} ${v.chapter}:${v.verse_start} ao ${v.verse_end}`);
        candidates.push(`${bName} ${v.chapter}:${v.verse_start} a ${v.verse_end}`);
        candidates.push(`${bName} ${v.chapter}:${v.verse_start} to ${v.verse_end}`);
      }
      // Português
      candidates.push(`${bName} capítulo ${v.chapter} versículo ${v.verse_start}`);
      candidates.push(`${bName} capítulo ${v.chapter} verso ${v.verse_start}`);
      candidates.push(`${bName} ${v.chapter} versículo ${v.verse_start}`);
      candidates.push(`${bName} ${v.chapter} verso ${v.verse_start}`);
      candidates.push(`${bName} cap ${v.chapter} ver ${v.verse_start}`);
      // Inglês
      candidates.push(`${bName} chapter ${v.chapter} verse ${v.verse_start}`);
      candidates.push(`${bName} chapter ${v.chapter} verses ${v.verse_start}`);
      candidates.push(`${bName} ${v.chapter} verse ${v.verse_start}`);
      candidates.push(`${bName} ${v.chapter} verses ${v.verse_start}`);
      candidates.push(`${bName} ch ${v.chapter} v ${v.verse_start}`);
      // Espanhol / Francês
      candidates.push(`${bName} capítulo ${v.chapter} versículo ${v.verse_start}`);
      candidates.push(`${bName} chapitre ${v.chapter} verset ${v.verse_start}`);
      candidates.push(`${bName} ${v.chapter} versículo ${v.verse_start}`);
      // Numérico
      candidates.push(`${bName} ${v.chapter}:${v.verse_start}`);
      candidates.push(`${bName} ${v.chapter}, ${v.verse_start}`);

      // Padrão versículo antes do capítulo
      candidates.push(`${bName} versículo ${v.verse_start} no capítulo ${v.chapter}`);
      candidates.push(`${bName} versículo ${v.verse_start} capítulo ${v.chapter}`);
      candidates.push(`versículo ${v.verse_start} do capítulo ${v.chapter} de ${bName}`);
      candidates.push(`versículo ${v.verse_start} do ${bName} ${v.chapter}`);

      if (v.is_chapter_only) {
        candidates.push(`${bName} capítulo ${v.chapter}`);
        candidates.push(`${bName} chapter ${v.chapter}`);
        candidates.push(`${bName} cap ${v.chapter}`);
        candidates.push(`${bName} ${v.chapter}`);
      }
    }

    for (const cand of candidates) {
      if (!cand) continue;
      const lowerCand = cand.toLowerCase();
      let pos = 0;
      while ((pos = lowerText.indexOf(lowerCand, pos)) !== -1) {
        allCandidateMatches.push({
          start: pos,
          end: pos + cand.length,
          verse: v,
          matchText: text.substring(pos, pos + cand.length)
        });
        pos = pos + 1;
      }
    }
  }

  // Ordena por comprimento DECRESCENTE (o match mais longo ganha SEMPRE)
  allCandidateMatches.sort((a, b) => {
    const lenA = a.end - a.start;
    const lenB = b.end - b.start;
    if (lenB !== lenA) return lenB - lenA;
    return a.start - b.start;
  });

  // Filtra sobreposições: os maiores matches têm prioridade absoluta
  const chosenMatches: MatchRange[] = [];
  for (const m of allCandidateMatches) {
    const hasOverlap = chosenMatches.some(ex => !(m.end <= ex.start || m.start >= ex.end));
    if (!hasOverlap) {
      chosenMatches.push(m);
    }
  }

  // Ordena cronologicamente por posição no texto
  chosenMatches.sort((a, b) => a.start - b.start);

  if (chosenMatches.length === 0) {
    return [{ type: 'text', content: text }];
  }

  const segments: TextSegment[] = [];
  let currentIdx = 0;

  for (const m of chosenMatches) {
    if (m.start > currentIdx) {
      segments.push({
        type: 'text',
        content: text.substring(currentIdx, m.start)
      });
    }
    segments.push({
      type: 'verse',
      content: m.matchText,
      verse: m.verse
    });
    currentIdx = m.end;
  }

  if (currentIdx < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(currentIdx)
    });
  }

  if (segmentsCache.size > 80) {
    segmentsCache.clear();
  }
  segmentsCache.set(cacheKey, segments);

  return segments;
}
