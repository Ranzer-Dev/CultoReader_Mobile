import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { TranslationService } from '../services/translation/TranslationService';
import { BibleManager } from '../services/bible/BibleManager';
import { TTSService } from '../services/audio/TTSService';
import { DetectedVerse } from '../types';

interface UseSimultaneousTranslationProps {
  initialSpeakerLocale?: string;
  initialTargetLang: string;
  detectedVerses: DetectedVerse[];
}

export function useSimultaneousTranslation({
  initialSpeakerLocale = 'pt-BR',
  initialTargetLang,
  detectedVerses
}: UseSimultaneousTranslationProps) {
  const [speakerLocale, setSpeakerLocale] = useState<string>(initialSpeakerLocale);
  const [targetLang, setTargetLang] = useState<string>(initialTargetLang);
  const [viewMode, setViewMode] = useState<'translated' | 'original'>('translated');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translatedTranscript, setTranslatedTranscript] = useState<string>('');
  const [translatedDetectedVerses, setTranslatedDetectedVerses] = useState<DetectedVerse[]>([]);
  const [isOfflineReady, setIsOfflineReady] = useState<boolean>(true);
  const [isDownloadingModel, setIsDownloadingModel] = useState<boolean>(false);
  const [autoSpeakEarphones, setAutoSpeakEarphones] = useState<boolean>(false);

  // Buffer consolidado de sentenças já finalizadas e traduzidas
  const confirmedTranslatedRef = useRef<string>('');
  const speakerLocaleRef = useRef<string>(speakerLocale);
  const targetLangRef = useRef<string>(targetLang);
  const detectedVersesRef = useRef<DetectedVerse[]>(detectedVerses);
  const lastTranslatedSourceChunkRef = useRef<string>('');
  const autoSpeakEarphonesRef = useRef<boolean>(false);
  autoSpeakEarphonesRef.current = autoSpeakEarphones;

  // Proteção contra chamadas paralelas de retradução pesada
  const fullTranslationInFlightRef = useRef<boolean>(false);

  // Controle de concorrência de streaming sem starvation
  const partialInFlightRef = useRef<boolean>(false);
  const pendingPartialChunkRef = useRef<string | null>(null);

  useEffect(() => {
    speakerLocaleRef.current = speakerLocale;
  }, [speakerLocale]);

  useEffect(() => {
    targetLangRef.current = targetLang;
  }, [targetLang]);

  useEffect(() => {
    detectedVersesRef.current = detectedVerses;
  }, [detectedVerses]);

  // Pré-aquece o modelo nativo ML Kit na memória RAM e verifica se o par está baixado
  useEffect(() => {
    async function initModel() {
      const sShort = speakerLocale.split('-')[0].toLowerCase();
      const tShort = targetLang.split('-')[0].toLowerCase();
      if (sShort === tShort) {
        setIsOfflineReady(true);
        return;
      }
      const ready = await TranslationService.isPairDownloaded(speakerLocale, targetLang);
      setIsOfflineReady(ready);

      if (ready) {
        // Pré-aquece na RAM sem bloquear a interface
        TranslationService.warmUp(speakerLocale, targetLang).catch(() => {});
      }
    }
    initModel();
  }, [speakerLocale, targetLang]);

  /**
   * Tradução em Lote: usada na troca explícita de idioma ou restauração de rascunho
   */
  const translateAllToTarget = useCallback(
    async (sourceText: string, sLoc = speakerLocaleRef.current, tL = targetLangRef.current) => {
      const sShort = sLoc.split('-')[0].toLowerCase();
      const tShort = tL.split('-')[0].toLowerCase();

      if (sShort === tShort || !sourceText.trim()) {
        confirmedTranslatedRef.current = sourceText;
        setTranslatedTranscript(sourceText);
        setTranslatedDetectedVerses(detectedVersesRef.current);
        return;
      }

      if (fullTranslationInFlightRef.current) return;
      fullTranslationInFlightRef.current = true;
      setIsTranslating(true);
      try {
        const trans = await TranslationService.translateLongText(sourceText, sLoc, tL);
        if (targetLangRef.current === tL) {
          confirmedTranslatedRef.current = trans;
          setTranslatedTranscript(trans);

          if (detectedVersesRef.current.length > 0) {
            const transVerses = await Promise.all(
              detectedVersesRef.current.map((v) => BibleManager.convertDetectedVerseToLanguage(v, tL))
            );
            setTranslatedDetectedVerses(transVerses);
          }
        }
      } catch (e) {
        console.warn('Erro ao retraduzir tudo:', e);
        if (targetLangRef.current === tL) {
          confirmedTranslatedRef.current = sourceText;
          setTranslatedTranscript(sourceText);
        }
      } finally {
        fullTranslationInFlightRef.current = false;
        setIsTranslating(false);
      }
    },
    []
  );

  /**
   * Troca segura do idioma de destino (com preservação imediata da tela e re-tradução garantida)
   */
  const switchTargetLanguage = useCallback(
    async (newTargetLang: string, sourceText?: string) => {
      if (!newTargetLang) return;
      const cleanLang = newTargetLang.trim().toLowerCase();

      setTargetLang(cleanLang);
      targetLangRef.current = cleanLang;

      // Descarta qualquer streaming provisório do idioma antigo
      pendingPartialChunkRef.current = null;
      lastTranslatedSourceChunkRef.current = '';

      const sLoc = speakerLocaleRef.current;
      const sShort = sLoc.split('-')[0].toLowerCase();
      const tShort = cleanLang.split('-')[0].toLowerCase();

      const textToTranslate = sourceText || '';

      // Caso 1: Idioma idêntico ao do pregador
      if (sShort === tShort || !textToTranslate.trim()) {
        confirmedTranslatedRef.current = textToTranslate;
        setTranslatedTranscript(textToTranslate);
        setTranslatedDetectedVerses(detectedVersesRef.current);
        setIsTranslating(false);
        return;
      }

      // Caso 2: Idioma diferente - retraduz o histórico acumulado
      setIsTranslating(true);
      try {
        const trans = await TranslationService.translateLongText(textToTranslate, sLoc, cleanLang);
        if (targetLangRef.current === cleanLang) {
          confirmedTranslatedRef.current = trans;
          setTranslatedTranscript(trans);

          if (detectedVersesRef.current.length > 0) {
            const transVerses = await Promise.all(
              detectedVersesRef.current.map((v) => BibleManager.convertDetectedVerseToLanguage(v, cleanLang))
            );
            setTranslatedDetectedVerses(transVerses);
          }
        }
      } catch (err) {
        console.warn('Erro ao trocar idioma de tradução:', err);
        // Fallback gracioso para nunca deixar a tela em branco
        if (targetLangRef.current === cleanLang) {
          confirmedTranslatedRef.current = textToTranslate;
          setTranslatedTranscript(textToTranslate);
        }
      } finally {
        setIsTranslating(false);
      }
    },
    []
  );

  /**
   * Atualiza versículos detectados e traduz automaticamente para o idioma de exibição ativo
   */
  const updateDetectedVerses = useCallback(
    async (verses: DetectedVerse[]) => {
      detectedVersesRef.current = verses;
      const tL = targetLangRef.current;
      const sShort = speakerLocaleRef.current.split('-')[0].toLowerCase();
      const tShort = tL.split('-')[0].toLowerCase();

      if (sShort !== tShort && verses.length > 0) {
        try {
          const transVerses = await Promise.all(
            verses.map((v) => BibleManager.convertDetectedVerseToLanguage(v, tL))
          );
          setTranslatedDetectedVerses(transVerses);
        } catch {
          setTranslatedDetectedVerses(verses);
        }
      } else {
        setTranslatedDetectedVerses(verses);
      }
    },
    []
  );

  /**
   * Troca segura do idioma de fala do pregador
   */
  const switchSpeakerLocale = useCallback(
    async (newLocale: string, sourceText?: string) => {
      if (!newLocale) return;
      const cleanLocale = newLocale.trim();

      setSpeakerLocale(cleanLocale);
      speakerLocaleRef.current = cleanLocale;

      if (sourceText && sourceText.trim()) {
        translateAllToTarget(sourceText, cleanLocale, targetLangRef.current);
      }
    },
    [translateAllToTarget]
  );

  /**
   * Processador de streaming parcial assíncrono sem starvation (0ms cold start)
   */
  const processPartialChunk = useCallback(
    async (chunkToProcess: string, sLoc: string, tL: string) => {
      partialInFlightRef.current = true;
      try {
        const partialTrans = await TranslationService.translate(chunkToProcess, sLoc, tL);
        if (targetLangRef.current === tL) {
          const cleanTrans = partialTrans.trim();
          const liveTrans = confirmedTranslatedRef.current
            ? `${confirmedTranslatedRef.current.trim()} ${cleanTrans}`
            : cleanTrans;
          setTranslatedTranscript(liveTrans);
        }
      } catch {
        if (targetLangRef.current === tL) {
          const liveTrans = confirmedTranslatedRef.current
            ? `${confirmedTranslatedRef.current.trim()} ${chunkToProcess}`
            : chunkToProcess;
          setTranslatedTranscript(liveTrans);
        }
      } finally {
        partialInFlightRef.current = false;
        // Se novos trechos foram emitidos pelo reconhecedor enquanto o modelo computava, processa o mais recente
        if (pendingPartialChunkRef.current && targetLangRef.current === tL) {
          const next = pendingPartialChunkRef.current;
          pendingPartialChunkRef.current = null;
          processPartialChunk(next, sLoc, tL);
        }
      }
    },
    []
  );

  /**
   * Tradução Incremental de Alto Desempenho O(1):
   * Em vez de retraduzir o histórico inteiro, traduz APENAS o novo trecho finalizado
   * e processa streaming provisório em tempo real sem starvation.
   */
  const handleIncrementalTranslation = useCallback(
    async (fullText: string, latestChunk: string, isFinal: boolean) => {
      const sLoc = speakerLocaleRef.current;
      const tL = targetLangRef.current;
      const sShort = sLoc.split('-')[0].toLowerCase();
      const tShort = tL.split('-')[0].toLowerCase();

      // Caso 1: Mesmo idioma (sem tradução necessária)
      if (sShort === tShort) {
        confirmedTranslatedRef.current = fullText;
        setTranslatedTranscript(fullText);
        return;
      }

      // Proteção de Sincronia: Se o buffer consolidado traduzido está vazio mas já existe histórico no original,
      // dispara a retradução do histórico em background (sem travar a escuta atual)
      if (!confirmedTranslatedRef.current && fullText.trim().length > 20) {
        if (!fullTranslationInFlightRef.current) {
          translateAllToTarget(fullText, sLoc, tL);
        }
      }

      // Caso 2: Sentença Finalizada pelo Android (Commit definitivo O(1) com anti-duplicação)
      if (isFinal) {
        pendingPartialChunkRef.current = null;

        const chunkToTranslate = latestChunk && latestChunk.trim() ? latestChunk.trim() : '';
        if (chunkToTranslate) {
          const stripPunct = (s: string) =>
            (s || '').toLowerCase().replace(/[^a-z0-9áàâãéèêíïóôõöúçñ]/gi, ' ').trim().replace(/\s+/g, ' ');
          const normChunk = stripPunct(chunkToTranslate);

          // Proteção 1: se for exatamente o mesmo trecho falado que já foi traduzido, ignora
          if (lastTranslatedSourceChunkRef.current && normChunk === lastTranslatedSourceChunkRef.current) {
            setTranslatedTranscript(confirmedTranslatedRef.current);
            return;
          }

          try {
            const translatedChunk = await TranslationService.translate(chunkToTranslate, sLoc, tL);
            const cleanTranslated = translatedChunk.trim();
            const normTranslated = stripPunct(cleanTranslated);
            const normCurrent = stripPunct(confirmedTranslatedRef.current);

            // Proteção 2: se o texto já traduzido termina com esta frase, ignora para não repetir em pausas
            if (normTranslated && normTranslated.length > 2 && normCurrent.endsWith(normTranslated)) {
              setTranslatedTranscript(confirmedTranslatedRef.current);
              return;
            }

            lastTranslatedSourceChunkRef.current = normChunk;
            const newConfirmed = confirmedTranslatedRef.current
              ? `${confirmedTranslatedRef.current.trim()} ${cleanTranslated}`
              : cleanTranslated;

            confirmedTranslatedRef.current = newConfirmed;
            setTranslatedTranscript(newConfirmed);

            // Se o modo de fone de ouvido para o estrangeiro estiver ligado, reproduz a sentença traduzida!
            if (autoSpeakEarphonesRef.current && cleanTranslated) {
              const speakLocale =
                tL === 'en' ? 'en-US' : tL === 'es' ? 'es-ES' : tL === 'fr' ? 'fr-FR' : 'pt-BR';
              TTSService.speak(cleanTranslated, { language: speakLocale }).catch(() => {});
            }
          } catch {
            // Em caso de falha temporária, mantém o acumulado
            setTranslatedTranscript(confirmedTranslatedRef.current || fullText);
          }
        } else if (!confirmedTranslatedRef.current && fullText.trim()) {
          // Inicialização única (ex: rascunho sem confirmedTranslated prévio)
          translateAllToTarget(fullText, sLoc, tL);
        }
        return;
      }

      // Caso 3: Streaming Provisório em Tempo Real (Sem Starvation / Resposta Instantânea)
      if (latestChunk && latestChunk.trim()) {
        const chunk = latestChunk.trim();
        if (partialInFlightRef.current) {
          pendingPartialChunkRef.current = chunk;
          return;
        }
        processPartialChunk(chunk, sLoc, tL);
      }
    },
    [processPartialChunk, translateAllToTarget]
  );

  const handleDownloadOfflineModel = async (currentSourceText?: string) => {
    setIsDownloadingModel(true);
    Alert.alert(
      'Baixar Tradutor Offline',
      `Deseja baixar o pacote de tradução offline de ${speakerLocale.toUpperCase()} para ${targetLang.toUpperCase()}? Ele permite traduzir 100% no chip do celular sem precisar de internet durante o culto.`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => setIsDownloadingModel(false) },
        {
          text: 'Baixar Agora',
          onPress: async () => {
            try {
              const ok = await TranslationService.downloadPair(speakerLocale, targetLang);
              if (ok) {
                setIsOfflineReady(true);
                Alert.alert('Sucesso', 'Tradutor offline pronto! Agora você pode traduzir sem internet.');
                TranslationService.warmUp(speakerLocale, targetLang).catch(() => {});
                if (currentSourceText && currentSourceText.trim()) {
                  translateAllToTarget(currentSourceText, speakerLocale, targetLang);
                }
              }
            } catch (err: any) {
              Alert.alert('Aviso', 'Não foi possível baixar agora: ' + (err.message || 'Verifique sua conexão Wi-Fi.'));
            } finally {
              setIsDownloadingModel(false);
            }
          }
        }
      ]
    );
  };

  const isTranslationActive = speakerLocale.split('-')[0].toLowerCase() !== targetLang.split('-')[0].toLowerCase();

  return {
    speakerLocale,
    setSpeakerLocale,
    targetLang,
    setTargetLang,
    viewMode,
    setViewMode,
    isTranslating,
    setIsTranslating,
    isTranslationActive,
    translatedTranscript,
    setTranslatedTranscript,
    translatedDetectedVerses,
    setTranslatedDetectedVerses,
    isOfflineReady,
    isDownloadingModel,
    translateAllToTarget,
    switchTargetLanguage,
    switchSpeakerLocale,
    updateDetectedVerses,
    handleIncrementalTranslation,
    handleDownloadOfflineModel,
    autoSpeakEarphones,
    setAutoSpeakEarphones,
    confirmedTranslatedRef,
    speakerLocaleRef,
    targetLangRef
  };
}
