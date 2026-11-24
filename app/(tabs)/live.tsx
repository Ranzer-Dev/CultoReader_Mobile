import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';

import { useAccessibility } from '../../src/context/AccessibilityContext';
import { useLanguage } from '../../src/i18n';
import { BibleManager } from '../../src/services/bible/BibleManager';
import { TranslationService } from '../../src/services/translation/TranslationService';
import { WorshipRepository } from '../../src/database/repositories/WorshipRepository';
import { NotesRepository } from '../../src/database/repositories/NotesRepository';
import { DetectedVerse } from '../../src/types';

import { parseTranscriptSegments } from '../../src/utils/transcriptParser';
import { useSimultaneousTranslation } from '../../src/hooks/useSimultaneousTranslation';
import { useLiveSession } from '../../src/hooks/useLiveSession';

import { LiveHeader } from '../../src/components/live/LiveHeader';
import { LiveTranslationBar } from '../../src/components/live/LiveTranslationBar';
import { LiveLanguagePickers } from '../../src/components/live/LiveLanguagePickers';
import { LiveTranscriptView } from '../../src/components/live/LiveTranscriptView';
import { LiveThumbZone } from '../../src/components/live/LiveThumbZone';
import { SaveWorshipModal } from '../../src/components/live/SaveWorshipModal';
import { VerseDetailModal } from '../../src/components/live/VerseDetailModal';
import { QuickNoteBottomSheet } from '../../src/components/QuickNoteBottomSheet';

export default function LiveTranscriptionScreen() {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, scaledFontSize, speakText } = useAccessibility();
  const { t, languageInfo, languages } = useLanguage();

  // Estados locais da tela
  const [inputText, setInputText] = useState('');
  const [selectedWord, setSelectedWord] = useState('');
  const [noteSheetVisible, setNoteSheetVisible] = useState(false);
  const [selectedVerseModal, setSelectedVerseModal] = useState<DetectedVerse | null>(null);
  const [isVersesSectionExpanded, setIsVersesSectionExpanded] = useState<boolean>(false);
  const [showSpeakerPicker, setShowSpeakerPicker] = useState<boolean>(false);
  const [showTargetPicker, setShowTargetPicker] = useState<boolean>(false);

  // Estados do Modal de Salvar Culto
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalPreacher, setModalPreacher] = useState('');
  const [modalTags, setModalTags] = useState('');
  const [modalSummary, setModalSummary] = useState('');

  // 1. Hook de Tradução Simultânea de Alto Desempenho
  const translation = useSimultaneousTranslation({
    initialSpeakerLocale: 'pt-BR',
    initialTargetLang: languageInfo.code,
    detectedVerses: []
  });

  // Callback quando versículos são identificados
  const handleVersesDetected = useCallback(
    async (verses: DetectedVerse[]) => {
      translation.updateDetectedVerses(verses);
    },
    [translation]
  );

  // 2. Hook de Sessão de Gravação & Persistência Contínua
  const session = useLiveSession({
    speakerLocale: translation.speakerLocale,
    targetLang: translation.targetLang,
    isTranslationActive: translation.isTranslationActive,
    onInitialDraftLoaded: (draftText) => {
      translation.translateAllToTarget(draftText, translation.speakerLocale, translation.targetLang);
    },
    onIncrementalTranslationUpdate: translation.handleIncrementalTranslation,
    onVersesDetected: handleVersesDetected
  });

  // Texto ativo exibido (traduzido ou original com fallback à prova de tela vazia e proteção contra truncamento)
  const activeDisplayText = useMemo(() => {
    if (!translation.isTranslationActive || translation.viewMode !== 'translated') {
      return session.originalTranscript;
    }
    const trans = (translation.translatedTranscript || '').trim();
    const orig = (session.originalTranscript || '').trim();

    if (!trans) return orig;

    // Se o texto original já é longo (ex: > 50 chars) mas a tradução possui menos de 15% do tamanho,
    // significa que a tradução em lote ainda está processando. Não trunca a tela do usuário!
    if (orig.length > 50 && trans.length < orig.length * 0.15) {
      return orig;
    }

    return trans;
  }, [
    translation.isTranslationActive,
    translation.viewMode,
    translation.translatedTranscript,
    session.originalTranscript
  ]);

  const activeVerses =
    translation.isTranslationActive && translation.viewMode === 'translated'
      ? translation.translatedDetectedVerses.length > 0
        ? translation.translatedDetectedVerses
        : session.detectedVerses
      : session.detectedVerses;

  const segments = useMemo(
    () => parseTranscriptSegments(activeDisplayText, activeVerses),
    [activeDisplayText, activeVerses]
  );

  // Manipuladores de Ação
  const handleToggleListening = async () => {
    if (session.isListening) {
      await session.stopListening();
    } else {
      await session.startListening();
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Limpar Transcrição',
      'Deseja descartar o texto transcrito até o momento? O rascunho temporário do SQLite será removido.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            await session.clearSession();
            translation.confirmedTranslatedRef.current = '';
            translation.setTranslatedTranscript('');
            translation.setTranslatedDetectedVerses([]);
          }
        }
      ]
    );
  };

  const handleAppendInputText = async () => {
    if (!inputText.trim()) return;
    await session.appendManualText(inputText);
    setInputText('');
  };

  const handleWordClick = (word: string) => {
    const cleanWord = word.replace(/[,.?!:;"]/g, '').trim();
    if (cleanWord.length > 0) {
      setSelectedWord(cleanWord);
      setNoteSheetVisible(true);
    }
  };

  const handleSaveNote = async (noteText: string, colorTag: string) => {
    try {
      let worshipId = session.activeDraftIdRef.current;
      if (!worshipId) {
        worshipId = await WorshipRepository.createLiveDraft(activeDisplayText || session.originalTranscript);
        session.activeDraftIdRef.current = worshipId;
      } else {
        await WorshipRepository.updateTranscriptOnly(worshipId, activeDisplayText || session.originalTranscript);
      }

      await NotesRepository.create({
        worship_id: worshipId,
        selected_text: selectedWord,
        note_text: noteText,
        color_tag: colorTag
      });

      Alert.alert('Anotação Salva', 'Anotação vinculada com sucesso ao culto de hoje!');
    } catch (err: any) {
      Alert.alert('Erro ao Salvar Anotação', err.message);
    }
  };

  const openSaveModal = async () => {
    if (!activeDisplayText.trim()) {
      Alert.alert('Transcrição Vazia', 'Grave ou digite algum conteúdo antes de salvar.');
      return;
    }
    const today = new Date().toLocaleDateString('pt-BR');
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const versesSummary = session.detectedVerses
      .map((v) => `${v.book} ${v.chapter}:${v.verse_start}${v.verse_end ? '-' + v.verse_end : ''}`)
      .join(', ');

    let currentDraft: any = null;
    if (session.activeDraftIdRef.current) {
      try {
        currentDraft = await WorshipRepository.findById(session.activeDraftIdRef.current);
      } catch {}
    }

    if (currentDraft) {
      if (!modalTitle) {
        setModalTitle(
          currentDraft.title && !currentDraft.title.startsWith('Culto em Andamento')
            ? currentDraft.title
            : `Culto - ${today} (${time})`
        );
      }
      if (!modalPreacher) {
        setModalPreacher(currentDraft.preacher && currentDraft.preacher !== 'Pregador' ? currentDraft.preacher : 'Pastor');
      }
      if (!modalTags) {
        setModalTags(
          currentDraft.tags && currentDraft.tags !== 'Ao Vivo'
            ? currentDraft.tags
            : versesSummary
            ? `Ao Vivo, Transcrito, ${versesSummary}`
            : 'Ao Vivo, Transcrito'
        );
      }
      if (!modalSummary) {
        setModalSummary(currentDraft.summary ? currentDraft.summary : versesSummary ? `Versículos citados: ${versesSummary}` : '');
      }
    } else {
      if (!modalTitle) setModalTitle(`Culto - ${today} (${time})`);
      if (!modalPreacher) setModalPreacher('Pastor');
      if (!modalTags) setModalTags(versesSummary ? `Ao Vivo, Transcrito, ${versesSummary}` : 'Ao Vivo, Transcrito');
      if (!modalSummary) setModalSummary(versesSummary ? `Versículos citados: ${versesSummary}` : '');
    }

    setSaveModalVisible(true);
  };

  const handleConfirmSaveWorship = async () => {
    if (!modalTitle.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe o título/tema do culto.');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const versesSummary = session.detectedVerses
        .map((v) => `${v.book} ${v.chapter}:${v.verse_start}${v.verse_end ? '-' + v.verse_end : ''}`)
        .join(', ');
      const fallbackSummary = versesSummary
        ? `Versículos citados: ${versesSummary}`
        : 'Transcrição capturada ao vivo pelo aplicativo.';
      const finalSummary = modalSummary.trim() || fallbackSummary;
      const finalTags = modalTags.trim() || (versesSummary ? `Ao Vivo, Transcrito, ${versesSummary}` : 'Ao Vivo, Transcrito');

      if (session.activeDraftIdRef.current) {
        await WorshipRepository.finalizeLiveDraft(
          session.activeDraftIdRef.current,
          modalTitle.trim(),
          modalPreacher.trim() || 'Pastor',
          finalSummary,
          finalTags,
          activeDisplayText || session.originalTranscript
        );
      } else {
        const created = await WorshipRepository.create({
          title: modalTitle.trim(),
          preacher: modalPreacher.trim() || 'Pastor',
          service_date: today,
          summary: finalSummary,
          full_transcript: activeDisplayText || session.originalTranscript,
          tags: finalTags
        });
        session.activeDraftIdRef.current = created.id;
      }

      setSaveModalVisible(false);
      session.setSaveStatusMessage('💾 Culto e detalhes salvos no SQLite com sucesso!');

      if (session.isListening) {
        Alert.alert(
          'Culto Salvo no SQLite',
          'Título, preletor, tags e resumo foram gravados! A gravação continua ativa no fundo para você continuar acompanhando a pregação.'
        );
      } else {
        Alert.alert('Salvo no SQLite', 'O culto e sua transcrição foram finalizados com sucesso!', [
          { text: 'Ver na Lista de Cultos', onPress: () => router.push('/(tabs)') },
          { text: 'Continuar Aqui', style: 'cancel' }
        ]);
      }
    } catch (err: any) {
      Alert.alert('Erro ao Salvar Culto', err.message);
    }
  };

  const handleReadAloudVerse = (verse: DetectedVerse) => {
    if (!verse.full_text) return;
    const isEn =
      (translation.isTranslationActive && translation.viewMode === 'translated' && translation.targetLang === 'en') ||
      verse.version_code === 'KJV';
    const isEs =
      (translation.isTranslationActive && translation.viewMode === 'translated' && translation.targetLang === 'es') ||
      verse.version_code === 'RVR';
    const isFr =
      (translation.isTranslationActive && translation.viewMode === 'translated' && translation.targetLang === 'fr') ||
      verse.version_code === 'LSG';
    const speakLang = isEn ? 'en-US' : isEs ? 'es-ES' : isFr ? 'fr-FR' : 'pt-BR';
    const intro = isEn
      ? `${verse.book}, chapter ${verse.chapter}, verse ${verse.verse_start}. `
      : isEs
      ? `${verse.book}, capítulo ${verse.chapter}, versículo ${verse.verse_start}. `
      : isFr
      ? `${verse.book}, chapitre ${verse.chapter}, verset ${verse.verse_start}. `
      : `${verse.book}, capítulo ${verse.chapter}, versículo ${verse.verse_start}. `;
    speakText(`${intro}${verse.full_text}`, { language: speakLang });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* 1. Header com Ações e i18n */}
      <LiveHeader
        title={t.tabs.live}
        subtitle={session.isListening ? t.live.listening : t.live.offlineMode}
        isListening={session.isListening}
        hasText={!!activeDisplayText}
        onPlayTTS={() => {
          const speakLang =
            translation.isTranslationActive && translation.viewMode === 'translated'
              ? translation.targetLang === 'en'
                ? 'en-US'
                : translation.targetLang === 'es'
                ? 'es-ES'
                : translation.targetLang === 'fr'
                ? 'fr-FR'
                : 'pt-BR'
              : translation.speakerLocale || 'pt-BR';
          speakText(activeDisplayText, { language: speakLang });
        }}
        onClear={handleClear}
        colors={colors}
        scaledFontSize={scaledFontSize}
      />

      {/* 2. Barra de Tradução Simultânea */}
      <LiveTranslationBar
        speakerLocale={translation.speakerLocale}
        targetLang={translation.targetLang}
        languages={languages}
        isTranslationActive={translation.isTranslationActive}
        isTranslating={translation.isTranslating}
        isOfflineReady={translation.isOfflineReady}
        isDownloadingModel={translation.isDownloadingModel}
        viewMode={translation.viewMode}
        autoSpeakEarphones={translation.autoSpeakEarphones}
        onToggleSpeakerPicker={() => {
          setShowSpeakerPicker((prev) => !prev);
          setShowTargetPicker(false);
        }}
        onToggleTargetPicker={() => {
          setShowTargetPicker((prev) => !prev);
          setShowSpeakerPicker(false);
        }}
        onToggleViewMode={() => {
          translation.setViewMode((prev) => (prev === 'translated' ? 'original' : 'translated'));
        }}
        onToggleAutoSpeakEarphones={() => {
          translation.setAutoSpeakEarphones((prev: boolean) => {
            const next = !prev;
            if (next) {
              Alert.alert(
                'Áudio Simultâneo no Fone 🎧',
                'Cada frase traduzida será falada em tempo real no seu fone de ouvido para você acompanhar a pregação.\n\nUse fones de ouvido para que o som da tradução não entre no microfone do celular.'
              );
            }
            return next;
          });
        }}
        onDownloadModel={() => {
          translation.handleDownloadOfflineModel(session.originalTranscript);
        }}
        colors={colors}
        scaledFontSize={scaledFontSize}
      />

      {/* 3. Dropdowns Horizontais de Idioma */}
      <LiveLanguagePickers
        showSpeakerPicker={showSpeakerPicker}
        showTargetPicker={showTargetPicker}
        speakerLocale={translation.speakerLocale}
        targetLang={translation.targetLang}
        languages={languages}
        onSelectSpeakerLocale={(locale) => {
          translation.switchSpeakerLocale(locale, session.originalTranscript);
          setShowSpeakerPicker(false);
        }}
        onSelectTargetLang={(code) => {
          translation.switchTargetLanguage(code, session.originalTranscript);
          setShowTargetPicker(false);
        }}
        colors={colors}
        scaledFontSize={scaledFontSize}
      />

      {/* 4. Área de Transcrição Central com Hiperlinks Bíblicos e Acordeon */}
      <LiveTranscriptView
        segments={segments}
        activeDisplayText={activeDisplayText}
        activeVerses={activeVerses}
        saveStatusMessage={session.saveStatusMessage}
        isListening={session.isListening}
        isVersesSectionExpanded={isVersesSectionExpanded}
        targetLang={translation.isTranslationActive && translation.viewMode === 'translated' ? translation.targetLang : undefined}
        onToggleVersesExpanded={() => setIsVersesSectionExpanded((prev) => !prev)}
        onWordClick={handleWordClick}
        onVerseClick={(v) => setSelectedVerseModal(v)}
        colors={colors}
        scaledFontSize={scaledFontSize}
      />

      {/* 5. Controles Thumb Zone na Base da Tela */}
      <LiveThumbZone
        inputText={inputText}
        onChangeInputText={setInputText}
        onSubmitInputText={handleAppendInputText}
        isListening={session.isListening}
        hasText={!!activeDisplayText}
        onToggleListening={handleToggleListening}
        onOpenSaveModal={openSaveModal}
        onOpenQuickNote={() => {
          setSelectedWord(activeDisplayText.slice(-30) || 'Culto de hoje');
          setNoteSheetVisible(true);
        }}
        bottomInset={insets.bottom}
        colors={colors}
        scaledFontSize={scaledFontSize}
      />

      {/* 6. Modal de Leitura do Versículo Bíblico */}
      <VerseDetailModal
        verse={selectedVerseModal}
        onClose={() => setSelectedVerseModal(null)}
        onReadAloud={handleReadAloudVerse}
        colors={colors}
        scaledFontSize={scaledFontSize}
      />

      {/* 7. Modal para Detalhes do Culto (Título, Pregador, Tags, Resumo) */}
      <SaveWorshipModal
        visible={saveModalVisible}
        onClose={() => setSaveModalVisible(false)}
        isListening={session.isListening}
        title={modalTitle}
        onChangeTitle={setModalTitle}
        preacher={modalPreacher}
        onChangePreacher={setModalPreacher}
        tags={modalTags}
        onChangeTags={setModalTags}
        summary={modalSummary}
        onChangeSummary={setModalSummary}
        detectedVerses={session.detectedVerses}
        onConfirmSave={handleConfirmSaveWorship}
        colors={colors}
        scaledFontSize={scaledFontSize}
      />

      {/* 8. Bottom Sheet para Anotações Rápidas */}
      <QuickNoteBottomSheet
        visible={noteSheetVisible}
        selectedText={selectedWord}
        onClose={() => setNoteSheetVisible(false)}
        onSave={handleSaveNote}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
