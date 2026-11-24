import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { TranscriptionService } from '../services/audio/TranscriptionService';
import { BibleReferenceDetector, reconcileDetectedVerses } from '../services/bible/BibleReferenceDetector';
import { BibleManager } from '../services/bible/BibleManager';
import { WorshipRepository } from '../database/repositories/WorshipRepository';
import { DetectedVerse } from '../types';

interface UseLiveSessionProps {
  speakerLocale: string;
  targetLang: string;
  isTranslationActive: boolean;
  onInitialDraftLoaded?: (text: string) => void;
  onIncrementalTranslationUpdate: (fullText: string, latestChunk: string, isFinal: boolean) => void;
  onVersesDetected: (verses: DetectedVerse[]) => void;
}

export function useLiveSession({
  speakerLocale,
  targetLang,
  isTranslationActive,
  onInitialDraftLoaded,
  onIncrementalTranslationUpdate,
  onVersesDetected
}: UseLiveSessionProps) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [originalTranscript, setOriginalTranscript] = useState<string>('');
  const [detectedVerses, setDetectedVerses] = useState<DetectedVerse[]>([]);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string>('Pronto para gravar');

  const activeDraftIdRef = useRef<number | null>(null);
  const autoSaveTimerRef = useRef<any>(null);
  const speakerLocaleRef = useRef<string>(speakerLocale);
  const targetLangRef = useRef<string>(targetLang);

  const onIncrementalTranslationUpdateRef = useRef(onIncrementalTranslationUpdate);
  onIncrementalTranslationUpdateRef.current = onIncrementalTranslationUpdate;

  const onVersesDetectedRef = useRef(onVersesDetected);
  onVersesDetectedRef.current = onVersesDetected;

  useEffect(() => {
    speakerLocaleRef.current = speakerLocale;
    TranscriptionService.setLocale(speakerLocale);
  }, [speakerLocale]);

  useEffect(() => {
    targetLangRef.current = targetLang;
  }, [targetLang]);

  // Ao desmontar a tela por completo, garante que o microfone é desligado
  useEffect(() => {
    return () => {
      TranscriptionService.stop().catch(() => {});
    };
  }, []);

  // Carrega rascunho de culto de hoje apenas na inicialização (uma única vez)
  useEffect(() => {
    async function loadTodayDraft() {
      try {
        const draft = await WorshipRepository.findLatestDraft();
        if (draft && draft.full_transcript && draft.full_transcript.trim().length > 0) {
          activeDraftIdRef.current = draft.id;
          setOriginalTranscript(draft.full_transcript);
          TranscriptionService.setTranscript(draft.full_transcript);

          const origVersion = BibleManager.getVersionForLanguage(speakerLocaleRef.current);
          const rawVerses = await BibleReferenceDetector.detectReferences(
            draft.full_transcript,
            origVersion,
            undefined,
            speakerLocaleRef.current.split('-')[0]
          );
          const verses = reconcileDetectedVerses([], rawVerses, draft.full_transcript);
          setDetectedVerses(verses);
          onVersesDetected(verses);

          if (onInitialDraftLoaded) {
            onInitialDraftLoaded(draft.full_transcript);
          }
          setSaveStatusMessage('💾 Rascunho anterior recuperado do SQLite');
        }
      } catch (e) {
        console.warn('Erro ao verificar rascunho inicial:', e);
      }
    }
    loadTodayDraft();
  }, []);

  const latestFullTextRef = useRef<string>('');
  const lastSavedLengthRef = useRef<number>(0);

  // Salvamento periódico espaçado e desacoplado no SQLite (a cada 30 segundos ou ao pausar)
  const flushToSQLite = useCallback(async (fullText: string) => {
    const clean = (fullText || '').trim();
    if (!clean || clean.length === lastSavedLengthRef.current) return;

    try {
      if (activeDraftIdRef.current) {
        await WorshipRepository.updateTranscriptOnly(activeDraftIdRef.current, clean);
      } else {
        const draftId = await WorshipRepository.createLiveDraft(clean);
        activeDraftIdRef.current = draftId;
      }
      lastSavedLengthRef.current = clean.length;
      setSaveStatusMessage('💾 Transcrição salva no SQLite (Protegida)');
    } catch (err) {
      console.warn('Erro no salvamento em segundo plano:', err);
    }
  }, []);

  const scheduleContinuousSave = useCallback((fullText: string) => {
    latestFullTextRef.current = fullText;

    // Se já houver um timer de flush rodando, não reinicia (mantém intervalo espaçado de 30s)
    if (autoSaveTimerRef.current) return;

    autoSaveTimerRef.current = setTimeout(async () => {
      autoSaveTimerRef.current = null;
      await flushToSQLite(latestFullTextRef.current);
    }, 30000);
  }, [flushToSQLite]);

  const scheduleContinuousSaveRef = useRef(scheduleContinuousSave);
  scheduleContinuousSaveRef.current = scheduleContinuousSave;

  const verseScanTimerRef = useRef<any>(null);

  // Detecção Bíblica Contínua em Tempo Real com Debounce Suave (250ms)
  // Roda enquanto o pregador está falando, sem precisar esperar o fim da frase!
  const scanVersesDebounced = useCallback((textToScan: string) => {
    if (!textToScan || !textToScan.trim()) return;
    if (verseScanTimerRef.current) {
      clearTimeout(verseScanTimerRef.current);
    }
    verseScanTimerRef.current = setTimeout(async () => {
      verseScanTimerRef.current = null;
      try {
        const sLoc = speakerLocaleRef.current;
        const origVersion = BibleManager.getVersionForLanguage(sLoc);
        // Analisa os últimos 800 caracteres ou o texto completo para máxima precisão
        const windowText = textToScan.length > 800 ? textToScan.slice(-800) : textToScan;
        const newVerses = await BibleReferenceDetector.detectReferences(
          windowText,
          origVersion,
          undefined,
          sLoc.split('-')[0]
        );
        if (newVerses && newVerses.length > 0) {
          setDetectedVerses((prev) => {
            const reconciled = reconcileDetectedVerses(prev, newVerses, textToScan);
            const isSame =
              reconciled.length === prev.length &&
              reconciled.every(
                (r, idx) =>
                  r.book === prev[idx]?.book &&
                  r.chapter === prev[idx]?.chapter &&
                  r.verse_start === prev[idx]?.verse_start &&
                  r.verse_end === prev[idx]?.verse_end
              );
            if (!isSame) {
              onVersesDetectedRef.current(reconciled);
              return reconciled;
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn('Erro ao detectar versículos:', err);
      }
    }, 250);
  }, []);

  const scanVersesDebouncedRef = useRef(scanVersesDebounced);
  scanVersesDebouncedRef.current = scanVersesDebounced;

  // Listener de Transcrição Contínua com Janela Deslizante de Alto Desempenho
  // Mantém inscrição estável durante toda a vida útil da sessão
  useEffect(() => {
    const unsubscribe = TranscriptionService.subscribe({
      onTextUpdate: async (fullText, latestChunk, isFinal) => {
        if (fullText && fullText.trim()) {
          latestFullTextRef.current = fullText;
          setOriginalTranscript(fullText);
          scanVersesDebouncedRef.current(fullText);
        }

        // 1. Notifica o módulo de tradução incremental
        onIncrementalTranslationUpdateRef.current(fullText, latestChunk, isFinal);

        // 2. Agenda salvamento em background espaçado
        scheduleContinuousSaveRef.current(fullText);
      },
      onStatusChange: (status) => {
        setIsListening(status);
        if (status) {
          setSaveStatusMessage('Gravando...');
        }
      },
      onError: (err) => {
        console.warn('Aviso de Transcrição:', err);
      }
    });

    return () => {
      unsubscribe();
      if (verseScanTimerRef.current) {
        clearTimeout(verseScanTimerRef.current);
      }
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const startListening = async () => {
    await TranscriptionService.start(originalTranscript);
  };

  const stopListening = async () => {
    await TranscriptionService.stop();
    // Flush imediato ao parar a gravação
    if (latestFullTextRef.current) {
      await flushToSQLite(latestFullTextRef.current);
    }
  };

  const appendManualText = async (chunk: string) => {
    if (!chunk.trim()) return;
    TranscriptionService.appendChunk(chunk.trim());
  };

  const clearSession = async () => {
    if (activeDraftIdRef.current) {
      try {
        await WorshipRepository.delete(activeDraftIdRef.current);
      } catch {}
      activeDraftIdRef.current = null;
    }
    TranscriptionService.clear();
    setOriginalTranscript('');
    setDetectedVerses([]);
    setSaveStatusMessage('Pronto para gravar');
  };

  return {
    isListening,
    originalTranscript,
    setOriginalTranscript,
    detectedVerses,
    setDetectedVerses,
    saveStatusMessage,
    setSaveStatusMessage,
    activeDraftIdRef,
    startListening,
    stopListening,
    appendManualText,
    clearSession,
    scheduleContinuousSave
  };
}
