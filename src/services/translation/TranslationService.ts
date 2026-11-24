import { NativeModules, Platform } from 'react-native';

const { MlKitTranslate } = NativeModules;

/**
 * Serviço de Tradução 100% Local / On-Device para o Culto Reader.
 * 
 * Regra de Ouro (agent.md Seção 0):
 * - ZERO chamadas de rede ou HTTP.
 * - Toda a tradução roda no hardware do celular via Google ML Kit On-Device (C++ Native Thread).
 * - Cache em memória O(1) para respostas instantâneas (0ms).
 */
export class TranslationService {
  private static cache = new Map<string, string>();
  private static pairAvailability = new Map<string, boolean>();

  /**
   * Normaliza código de idioma para formato ISO simples (ex: 'pt-BR' -> 'pt', 'en-US' -> 'en')
   */
  static normalizeLangCode(code: string): string {
    if (!code) return 'pt';
    const clean = code.trim().toLowerCase();
    return clean.split('-')[0].split('_')[0];
  }

  /**
   * Pré-aquece o modelo nativo ML Kit na memória RAM para eliminar o cold start (0ms na primeira frase)
   */
  static async warmUp(sourceLang: string, targetLang: string): Promise<void> {
    const sLang = this.normalizeLangCode(sourceLang);
    const tLang = this.normalizeLangCode(targetLang);
    if (sLang === tLang) return;

    if (Platform.OS === 'android' && MlKitTranslate && typeof MlKitTranslate.translate === 'function') {
      try {
        await MlKitTranslate.translate('Deus', sLang, tLang);
      } catch {}
    }
  }

  /**
   * Traduz um trecho de texto (frase ou oração) usando exclusivamente o motor on-device
   */
  static async translate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> {
    const cleanText = (text || '').trim();
    if (!cleanText) return text;

    const sLang = this.normalizeLangCode(sourceLang);
    const tLang = this.normalizeLangCode(targetLang);

    if (sLang === tLang) {
      return text;
    }

    const cacheKey = `${sLang}|${tLang}|${cleanText}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 100% OFFLINE ON-DEVICE INFERENCE
    if (Platform.OS === 'android' && MlKitTranslate && typeof MlKitTranslate.translate === 'function') {
      try {
        let timeoutHandle: any;
        const timeoutPromise = new Promise<string>((_, reject) => {
          timeoutHandle = setTimeout(() => reject(new Error('Translation timeout')), 2500);
        });
        const translatePromise = MlKitTranslate.translate(cleanText, sLang, tLang);
        const translated = await Promise.race([translatePromise, timeoutPromise]);
        clearTimeout(timeoutHandle);

        if (translated && typeof translated === 'string' && translated.trim().length > 0) {
          const result = translated.trim();
          this.cache.set(cacheKey, result);
          return result;
        }
      } catch (err) {
        // Falha ou modelo ainda não baixado ou timeout
      }
    }

    // Fallback gracioso: retorna o texto original limpo (sem requisições HTTP)
    return text;
  }

  /**
   * Verifica se o par de idiomas está baixado e pronto para tradução 100% offline
   */
  static async isPairDownloaded(sourceLang: string, targetLang: string): Promise<boolean> {
    const sLang = this.normalizeLangCode(sourceLang);
    const tLang = this.normalizeLangCode(targetLang);

    if (sLang === tLang) return true;

    const key = `${sLang}->${tLang}`;
    if (this.pairAvailability.get(key) === true) {
      return true;
    }

    if (Platform.OS === 'android' && MlKitTranslate && typeof MlKitTranslate.isPairDownloaded === 'function') {
      try {
        const ready: boolean = await MlKitTranslate.isPairDownloaded(sLang, tLang);
        if (ready) {
          this.pairAvailability.set(key, true);
        }
        return !!ready;
      } catch (err) {
        return false;
      }
    }
    return false;
  }

  /**
   * Baixa o pacote do par de idiomas para permitir a tradução offline
   */
  static async downloadPair(sourceLang: string, targetLang: string): Promise<boolean> {
    const sLang = this.normalizeLangCode(sourceLang);
    const tLang = this.normalizeLangCode(targetLang);

    if (sLang === tLang) return true;

    if (Platform.OS === 'android' && MlKitTranslate && typeof MlKitTranslate.downloadPair === 'function') {
      try {
        const ok: boolean = await MlKitTranslate.downloadPair(sLang, tLang);
        if (ok) {
          this.pairAvailability.set(`${sLang}->${tLang}`, true);
        }
        return !!ok;
      } catch (err) {
        throw err;
      }
    }
    return false;
  }

  /**
   * Compatibilidade para verificação por idioma único
   */
  static async isModelDownloaded(langCode: string): Promise<boolean> {
    const clean = this.normalizeLangCode(langCode);
    if (Platform.OS === 'android' && MlKitTranslate && typeof MlKitTranslate.isModelDownloaded === 'function') {
      try {
        return await MlKitTranslate.isModelDownloaded(clean);
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Compatibilidade para download por idioma único
   */
  static async downloadModel(langCode: string): Promise<boolean> {
    const clean = this.normalizeLangCode(langCode);
    if (Platform.OS === 'android' && MlKitTranslate && typeof MlKitTranslate.downloadModel === 'function') {
      try {
        return await MlKitTranslate.downloadModel(clean);
      } catch (err) {
        throw err;
      }
    }
    return false;
  }

  /**
   * Divide texto em sentenças mantendo pontuação para tradução incremental sem quebrar o cache
   */
  static splitIntoSentences(text: string): string[] {
    const trimmed = (text || '').trim();
    if (!trimmed) return [];
    // Divide por pontuação forte de fim de oração ou quebra de linha
    const sentences = trimmed.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g);
    if (!sentences) return [trimmed];
    
    // Se alguma sentença for excessivamente longa (mais de 200 caracteres sem pontuação), fatia por cláusulas
    const result: string[] = [];
    for (const sent of sentences) {
      const sTrim = sent.trim();
      if (sTrim.length > 200 && sTrim.includes(',')) {
        const subParts = sTrim.match(/[^,]+,+|[^,]+$/g);
        if (subParts) {
          result.push(...subParts.map(p => p.trim()).filter(p => p.length > 0));
          continue;
        }
      }
      if (sTrim.length > 0) {
        result.push(sTrim);
      }
    }
    return result.length > 0 ? result : [trimmed];
  }

  /**
   * Traduz um texto longo sentença por sentença mantendo fluidez máxima e cache permanente.
   * Processa em lotes concorrentes (batch size 6) para acelerar a retradução em até 6x.
   */
  static async translateLongText(
    fullText: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> {
    const sLang = this.normalizeLangCode(sourceLang);
    const tLang = this.normalizeLangCode(targetLang);

    if (sLang === tLang || !fullText.trim()) {
      return fullText;
    }

    const sentences = this.splitIntoSentences(fullText);
    if (sentences.length === 0) return fullText;

    const batchSize = 6;
    const translatedList: string[] = new Array(sentences.length);

    for (let i = 0; i < sentences.length; i += batchSize) {
      const chunk = sentences.slice(i, i + batchSize);
      const translatedBatch = await Promise.all(
        chunk.map(sent => this.translate(sent, sourceLang, targetLang))
      );
      for (let j = 0; j < translatedBatch.length; j++) {
        translatedList[i + j] = translatedBatch[j];
      }
    }

    return translatedList.join(' ');
  }
}
