import { NativeModules, Platform } from 'react-native';
import { CANONICAL_BOOKS, CanonicalBookInfo } from './BibleBooksData';
import { SupportedLanguage } from '../../i18n/types';
import { TranslationService } from '../translation/TranslationService';

const { MlKitTranslate } = NativeModules;

export interface BibleVersionMeta {
  code: string;
  name: string;
  shortName: string;
  language: SupportedLanguage | string;
  languageName: string;
  flag: string;
  isBundled: boolean;
  description: string;
}

export interface BibleBookData {
  abbrev: string;
  name: string;
  chapters: string[][];
}

export const REGISTERED_BIBLE_VERSIONS: BibleVersionMeta[] = [
  // Português (Brasil & Moçambique)
  {
    code: 'NVI',
    name: 'Nova Versão Internacional',
    shortName: 'NVI',
    language: 'pt',
    languageName: 'Português',
    flag: '🇧🇷🇲🇿',
    isBundled: true,
    description: 'Tradução contemporânea, clara e amplamente utilizada.'
  },
  {
    code: 'ACF',
    name: 'Almeida Corrigida Fiel',
    shortName: 'ACF',
    language: 'pt',
    languageName: 'Português',
    flag: '🇧🇷',
    isBundled: true,
    description: 'Tradução clássica e fiel aos textos receptus tradicionais.'
  },
  // Inglês
  {
    code: 'KJV',
    name: 'King James Version',
    shortName: 'KJV',
    language: 'en',
    languageName: 'English',
    flag: '🇺🇸🇬🇧',
    isBundled: true,
    description: 'The monumental, timeless English translation.'
  },
  // Espanhol
  {
    code: 'RVR',
    name: 'Reina-Valera 1960',
    shortName: 'RVR',
    language: 'es',
    languageName: 'Español',
    flag: '🇪🇸',
    isBundled: true,
    description: 'La versión más leída y amada en el mundo hispano.'
  },
  // África / Suaíli
  {
    code: 'SWA',
    name: 'Biblia Takatifu (Kiswahili)',
    shortName: 'SW',
    language: 'sw',
    languageName: 'Kiswahili',
    flag: '🇹🇿🇰🇪',
    isBundled: false,
    description: 'Biblia kamili ya Kiswahili inayotumiwa Afrika Mashariki.'
  },
  // Moçambique / Changana
  {
    code: 'TSO',
    name: 'Bhibhiliya yo Kwetsima (Changana)',
    shortName: 'TS',
    language: 'ts',
    languageName: 'Changana / Xitsonga',
    flag: '🇲🇿🇿🇦',
    isBundled: false,
    description: 'Bhibhiliya yo Kwetsima leyi tirhisiwaka eDzongeni ra Afrika na Mozambique.'
  },
  // Francês (África Central e Ocidental + Europa)
  {
    code: 'LSG',
    name: 'Louis Segond 1910',
    shortName: 'LSG',
    language: 'fr',
    languageName: 'Français',
    flag: '🇫🇷🇨🇩',
    isBundled: false,
    description: 'Traduction française classique de référence.'
  }
];

// Cache em memória para versões carregadas e versículos convertidos
const memoryCache = new Map<string, Map<string, string[][]>>();
const convertedVerseCache = new Map<string, any>();

function stripAccents(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export class BibleManager {
  static getVersions(): BibleVersionMeta[] {
    return REGISTERED_BIBLE_VERSIONS;
  }

  static getVersionForLanguage(langCode: string): string {
    const clean = (langCode || 'pt').split('-')[0].toLowerCase();
    switch (clean) {
      case 'en': return 'KJV';
      case 'es': return 'RVR';
      case 'fr': return 'LSG';
      case 'sw': return 'SWA';
      case 'ts': return 'TSO';
      default: return 'NVI';
    }
  }

  static getVersionMeta(code: string): BibleVersionMeta {
    return (
      REGISTERED_BIBLE_VERSIONS.find(v => v.code.toUpperCase() === code.toUpperCase()) ||
      REGISTERED_BIBLE_VERSIONS[0]
    );
  }

  static getCanonicalBooks(): CanonicalBookInfo[] {
    return CANONICAL_BOOKS;
  }

  static findBookInfo(query: string): CanonicalBookInfo | undefined {
    const q = stripAccents(query);
    return CANONICAL_BOOKS.find(b => {
      if (b.abbrev.toLowerCase() === q) return true;
      for (const val of Object.values(b.names)) {
        if (stripAccents(val) === q) return true;
      }
      return false;
    });
  }

  static getBookDisplayName(bookInfo: CanonicalBookInfo, lang: string = 'pt'): string {
    const cleanLang = (lang || 'pt').split('-')[0].toLowerCase();
    const supported = ['pt', 'en', 'es', 'fr', 'sw', 'ts'] as const;
    const key = supported.includes(cleanLang as any) ? (cleanLang as typeof supported[number]) : 'pt';
    return bookInfo.names[key] || bookInfo.names.pt;
  }

  /**
   * Carrega os livros de uma versão bíblica sob demanda dos assets nativos do APK
   */
  static async loadVersionData(versionCode: string = 'NVI'): Promise<Map<string, string[][]>> {
    const code = versionCode.toUpperCase();
    if (memoryCache.has(code)) {
      return memoryCache.get(code)!;
    }

    const bookMap = new Map<string, string[][]>();

    let assetFile = 'bible/bible_nvi.json';
    if (code === 'KJV' || code === 'EN') {
      assetFile = 'bible/bible_kjv.json';
    } else if (code === 'RVR' || code === 'ES') {
      assetFile = 'bible/bible_rvr.json';
    }

    try {
      let rawData: BibleBookData[] | null = null;
      if (Platform.OS === 'android' && MlKitTranslate && typeof MlKitTranslate.readAssetFile === 'function') {
        try {
          const content: string = await MlKitTranslate.readAssetFile(assetFile);
          if (content && content.trim().length > 0) {
            rawData = JSON.parse(content);
          }
        } catch (err) {
          console.warn(`Erro ao carregar asset ${assetFile}:`, err);
        }
      }

      // Se falhou e não era NVI, tenta carregar NVI como base
      if (!rawData && assetFile !== 'bible/bible_nvi.json') {
        try {
          const fallbackContent: string = await MlKitTranslate.readAssetFile('bible/bible_nvi.json');
          if (fallbackContent && fallbackContent.trim().length > 0) {
            rawData = JSON.parse(fallbackContent);
          }
        } catch {}
      }

      if (rawData) {
        for (const book of rawData) {
          bookMap.set(stripAccents(book.name), book.chapters);
          bookMap.set(book.abbrev.toLowerCase().trim(), book.chapters);

          // Também indexa por todos os nomes canônicos multilíngues (en, es, pt, etc.)
          const bookInfo = this.findBookInfo(book.abbrev) || this.findBookInfo(book.name);
          if (bookInfo) {
            for (const name of Object.values(bookInfo.names)) {
              bookMap.set(stripAccents(name), book.chapters);
            }
          }
        }
      }
    } catch (err) {
      console.warn(`Erro ao carregar versão ${code}:`, err);
    }

    memoryCache.set(code, bookMap);
    return bookMap;
  }

  /**
   * Obtém versículos de um capítulo
   */
  static async getChapterVerses(
    versionCode: string,
    bookNameOrAbbrev: string,
    chapter: number
  ): Promise<string[]> {
    const map = await this.loadVersionData(versionCode);
    const norm = stripAccents(bookNameOrAbbrev);
    let chapters = map.get(norm);

    if (!chapters) {
      const bookInfo = this.findBookInfo(bookNameOrAbbrev);
      if (bookInfo) {
        chapters = map.get(stripAccents(bookInfo.names.pt)) ||
                   map.get(stripAccents(bookInfo.names.en)) ||
                   map.get(bookInfo.abbrev.toLowerCase());
      }
    }

    if (chapters && chapter >= 1 && chapter <= chapters.length) {
      return chapters[chapter - 1] || [];
    }

    return [];
  }

  /**
   * Obtém um versículo individual, traduzindo sob demanda se o idioma for diferente
   */
  static async getVerseText(
    versionCode: string,
    bookNameOrAbbrev: string,
    chapter: number,
    verse: number,
    targetLang?: string
  ): Promise<string | null> {
    const verses = await this.getChapterVerses(versionCode, bookNameOrAbbrev, chapter);
    if (verse >= 1 && verse <= verses.length) {
      const original = verses[verse - 1];
      const tClean = targetLang ? targetLang.split('-')[0].toLowerCase() : undefined;
      const meta = this.getVersionMeta(versionCode);
      const isActuallyInPortuguese = meta.code === 'NVI' || meta.code === 'ACF' || !meta.isBundled;

      if (tClean && tClean !== 'pt' && isActuallyInPortuguese) {
        return await TranslationService.translate(original, 'pt', tClean);
      }
      return original;
    }
    return null;
  }

  /**
   * Obtém um intervalo de versículos (ex: 2 ao 4)
   */
  static async getVersesRangeText(
    versionCode: string,
    bookNameOrAbbrev: string,
    chapter: number,
    startVerse: number,
    endVerse: number,
    targetLang?: string
  ): Promise<string | null> {
    const verses = await this.getChapterVerses(versionCode, bookNameOrAbbrev, chapter);
    const selected: string[] = [];
    for (let v = startVerse; v <= Math.min(endVerse, verses.length); v++) {
      if (v >= 1 && verses[v - 1]) {
        selected.push(`${v}. ${verses[v - 1]}`);
      }
    }
    if (selected.length === 0) return null;
    const full = selected.join(' ');
    const tClean = targetLang ? targetLang.split('-')[0].toLowerCase() : undefined;
    const meta = this.getVersionMeta(versionCode);
    const isActuallyInPortuguese = meta.code === 'NVI' || meta.code === 'ACF' || !meta.isBundled;

    if (tClean && tClean !== 'pt' && isActuallyInPortuguese) {
      return await TranslationService.translate(full, 'pt', tClean);
    }
    return full;
  }

  /**
   * Converte um versículo detectado (em qualquer língua) para o idioma de destino do usuário.
   * Altera o nome do livro, a versão da Bíblia (ex: KJV para inglês, RVR para espanhol)
   * e carrega o texto completo traduzido ou nativo daquela versão.
   */
  static async convertDetectedVerseToLanguage(
    verse: any,
    targetLang: string
  ): Promise<any> {
    const tClean = (targetLang || 'pt').split('-')[0].toLowerCase();
    const cacheKey = `${verse.book}_${verse.chapter}_${verse.verse_start}_${verse.verse_end || ''}_${tClean}`;
    if (convertedVerseCache.has(cacheKey)) {
      return convertedVerseCache.get(cacheKey);
    }

    const targetVersion = this.getVersionForLanguage(tClean);

    // 1. Identifica as informações canônicas do livro
    const bookInfo = this.findBookInfo(verse.book) || this.findBookInfo(verse.raw_match || '');
    const displayBook = bookInfo
      ? this.getBookDisplayName(bookInfo, tClean)
      : verse.book;
    const canonicalSearchName = bookInfo ? bookInfo.names.pt : verse.book;

    // 2. Busca o texto na versão de destino (KJV para inglês, RVR para espanhol, etc.)
    let fullText: string | undefined;
    try {
      if (verse.verse_end && verse.verse_end > verse.verse_start) {
        fullText = (await this.getVersesRangeText(
          targetVersion,
          canonicalSearchName,
          verse.chapter,
          verse.verse_start,
          verse.verse_end,
          tClean
        )) || undefined;
      } else {
        fullText = (await this.getVerseText(
          targetVersion,
          canonicalSearchName,
          verse.chapter,
          verse.verse_start,
          tClean
        )) || undefined;
      }
    } catch (e) {
      console.warn('Erro ao converter versículo para idioma de destino:', e);
    }

    const converted = {
      ...verse,
      book: displayBook,
      version_code: targetVersion,
      full_text: fullText || verse.full_text
    };
    convertedVerseCache.set(cacheKey, converted);
    return converted;
  }
}
