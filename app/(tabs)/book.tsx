import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Calendar,
  User,
  Bookmark,
  Sparkles
} from 'lucide-react-native';
import { useAccessibility } from '../../src/context/AccessibilityContext';
import { useLanguage } from '../../src/i18n';
import { WorshipRepository } from '../../src/database/repositories/WorshipRepository';
import { NotesRepository } from '../../src/database/repositories/NotesRepository';
import { WorshipService, WorshipNote, DetectedVerse } from '../../src/types';
import { TTSService } from '../../src/services/audio/TTSService';
import { BibleReader } from '../../src/components/bible/BibleReader';
import { LanguageSelectorButton } from '../../src/components/LanguageSelectorButton';
import { useTranslatedWorships } from '../../src/services/translation/WorshipContentTranslator';
import { BibleReferenceDetector, reconcileDetectedVerses } from '../../src/services/bible/BibleReferenceDetector';
import { BibleManager } from '../../src/services/bible/BibleManager';
import { parseTranscriptSegments } from '../../src/utils/transcriptParser';
import { VerseCard } from '../../src/components/VerseCard';
import { VerseDetailModal } from '../../src/components/live/VerseDetailModal';

export default function BookModeScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string; worshipId?: string; ts?: string }>();
  const { colors, scaledFontSize, speakText } = useAccessibility();
  const { t, language, languageInfo } = useLanguage();

  const [activeMode, setActiveMode] = useState<'bible' | 'worship'>(
    params.mode === 'worship' || params.worshipId ? 'worship' : 'bible'
  );
  const [cultos, setCultos] = useState<WorshipService[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<WorshipNote[]>([]);
  const [chapterVerses, setChapterVerses] = useState<DetectedVerse[]>([]);
  const [selectedVerseModal, setSelectedVerseModal] = useState<DetectedVerse | null>(null);
  const [isReadingAudio, setIsReadingAudio] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const cultosRef = useRef<WorshipService[]>([]);
  cultosRef.current = cultos;
  const pendingWorshipIdRef = useRef<number | null>(null);
  const lastHandledNavKeyRef = useRef<string>('');
  const loadRequestIdRef = useRef(0);

  // Reage uma única vez por clique em card de culto (aba Cultos ou Calendário), sem travar troca de página/aba depois
  useEffect(() => {
    const navKey = `${params.mode || ''}|${params.worshipId || ''}|${params.ts || ''}`;
    if (navKey === '||' || navKey === lastHandledNavKeyRef.current) return;
    lastHandledNavKeyRef.current = navKey;

    if (params.mode === 'worship' || params.worshipId) {
      setActiveMode('worship');
    }
    if (params.worshipId) {
      const targetId = Number(params.worshipId);
      if (!Number.isNaN(targetId)) {
        const foundIdx = cultosRef.current.findIndex(c => c.id === targetId);
        if (foundIdx !== -1) {
          setCurrentIndex(foundIdx);
          pendingWorshipIdRef.current = null;
          scrollViewRef.current?.scrollTo({ y: 0, animated: false });
        } else {
          pendingWorshipIdRef.current = targetId;
        }
      }
    }
  }, [params.mode, params.worshipId, params.ts]);

  const loadAllCultos = useCallback(async () => {
    const reqId = ++loadRequestIdRef.current;
    setLoading(true);
    try {
      const result = await WorshipRepository.findPaginated({
        page: 1,
        pageSize: 100
      });
      if (reqId !== loadRequestIdRef.current) return;
      const sorted = [...result.data].sort((a, b) => a.service_date.localeCompare(b.service_date));
      setCultos(sorted);

      if (pendingWorshipIdRef.current !== null) {
        const targetIdx = sorted.findIndex(c => c.id === pendingWorshipIdRef.current);
        if (targetIdx !== -1) {
          setCurrentIndex(targetIdx);
          pendingWorshipIdRef.current = null;
        }
      } else {
        setCurrentIndex(prev => (sorted.length > 0 ? Math.min(prev, sorted.length - 1) : 0));
      }
    } finally {
      if (reqId === loadRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAllCultos();
    }, [loadAllCultos])
  );

  const { items: localizedCultos } = useTranslatedWorships(cultos, language);
  const originalCulto: WorshipService | undefined = cultos[currentIndex];
  const currentCulto: WorshipService | undefined = localizedCultos[currentIndex];

  // Carrega anotações e detecta automaticamente livros & versículos citados no culto atual
  useEffect(() => {
    let cancelled = false;

    TTSService.stop().catch(() => {});
    setIsReadingAudio(false);

    if (!currentCulto) {
      setNotes([]);
      setChapterVerses([]);
      return;
    }

    NotesRepository.findByWorshipId(currentCulto.id)
      .then(fetchedNotes => {
        if (!cancelled) setNotes(fetchedNotes);
      })
      .catch(() => {
        if (!cancelled) setNotes([]);
      });

    async function detectChapterVerses() {
      if (!currentCulto) return;
      try {
        const targetVersion = BibleManager.getVersionForLanguage(language);
        const origText = [originalCulto?.summary, originalCulto?.full_transcript].filter(Boolean).join('\n');
        const locText = [currentCulto.summary, currentCulto.full_transcript].filter(Boolean).join('\n');

        const detectedFromOrig = origText
          ? await BibleReferenceDetector.detectReferences(origText, 'NVI', undefined, 'pt')
          : [];
        const detectedFromLoc =
          locText && locText !== origText
            ? await BibleReferenceDetector.detectReferences(locText, targetVersion, undefined, language)
            : [];

        const combined = reconcileDetectedVerses(
          detectedFromOrig,
          detectedFromLoc,
          `${origText}\n${locText}`
        );

        const localizedVerses = await Promise.all(
          combined.map(v => BibleManager.convertDetectedVerseToLanguage(v, language))
        );

        if (!cancelled) {
          setChapterVerses(localizedVerses);
        }
      } catch (err) {
        console.warn('Erro ao detectar versículos no modo livro:', err);
        if (!cancelled) setChapterVerses([]);
      }
    }

    detectChapterVerses();

    return () => {
      cancelled = true;
    };
  }, [
    currentCulto?.id,
    originalCulto?.summary,
    originalCulto?.full_transcript,
    currentCulto?.summary,
    currentCulto?.full_transcript,
    language
  ]);

  // Lista única dos livros bíblicos citados neste culto (ex.: Salmos, João, Romanos)
  const citedBooksSummary = useMemo(() => {
    const map = new Map<string, { book: string; count: number; firstVerse: DetectedVerse }>();
    for (const v of chapterVerses) {
      const existing = map.get(v.book);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(v.book, { book: v.book, count: 1, firstVerse: v });
      }
    }
    return Array.from(map.values());
  }, [chapterVerses]);

  // Pré-calcula segmentos destacados por parágrafo para o corpo e para o resumo
  const transcriptParagraphs = useMemo(() => {
    const body = currentCulto?.full_transcript || '';
    if (!body.trim()) return [];
    return body.split(/\n+/).map(p => parseTranscriptSegments(p, chapterVerses));
  }, [currentCulto?.full_transcript, chapterVerses]);

  const summarySegments = useMemo(() => {
    const summary = currentCulto?.summary || '';
    if (!summary.trim()) return [];
    return parseTranscriptSegments(summary, chapterVerses);
  }, [currentCulto?.summary, chapterVerses]);

  const handleNextPage = () => {
    if (currentIndex < localizedCultos.length - 1) {
      setCurrentIndex(prev => prev + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handlePrevPage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleToggleAudio = async () => {
    if (isReadingAudio) {
      await TTSService.stop();
      setIsReadingAudio(false);
    } else if (currentCulto) {
      setIsReadingAudio(true);
      const chapterLabel = t.bible.chapter;
      const preacherLabel = t.worship.preacher.split('/')[0].trim();
      const content = `${chapterLabel} ${currentIndex + 1}. ${currentCulto.title}. ${preacherLabel}: ${currentCulto.preacher}. ${currentCulto.full_transcript || currentCulto.summary}`;
      await speakText(content, { language: languageInfo.speechLocale });
      setIsReadingAudio(false);
    }
  };

  const handleReadAloudVerse = (verse: DetectedVerse) => {
    if (!verse.full_text) return;
    const langCode = languageInfo.code;
    const intro =
      langCode === 'en'
        ? `${verse.book}, chapter ${verse.chapter}, verse ${verse.verse_start}. `
        : langCode === 'es'
        ? `${verse.book}, capítulo ${verse.chapter}, versículo ${verse.verse_start}. `
        : langCode === 'fr'
        ? `${verse.book}, chapitre ${verse.chapter}, verset ${verse.verse_start}. `
        : langCode === 'sw'
        ? `${verse.book}, sura ${verse.chapter}, mstari ${verse.verse_start}. `
        : `${verse.book}, capítulo ${verse.chapter}, versículo ${verse.verse_start}. `;
    speakText(`${intro}${verse.full_text}`, { language: languageInfo.speechLocale });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header com Seletor Universal de Idioma */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 }}>
        <Text style={{ color: colors.text, fontSize: scaledFontSize(20), fontWeight: '700' }}>
          {t.tabs.book}
        </Text>
        <LanguageSelectorButton />
      </View>

      {/* Alternador de Modo no Topo: Bíblia Sagrada | Livro de Mensagens */}
      <View style={[styles.topSegmentedWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.segmentedButton,
            activeMode === 'bible' && { backgroundColor: colors.primary }
          ]}
          onPress={() => {
            TTSService.stop();
            setIsReadingAudio(false);
            setActiveMode('bible');
          }}
          accessibilityRole="button"
          accessibilityLabel={t.bookTab.holyBible}
        >
          <BookOpen
            size={scaledFontSize(16)}
            color={activeMode === 'bible' ? colors.primaryText : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentedButtonText,
              {
                color: activeMode === 'bible' ? colors.primaryText : colors.textSecondary,
                fontSize: scaledFontSize(13)
              }
            ]}
          >
            {t.bookTab.holyBible}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentedButton,
            activeMode === 'worship' && { backgroundColor: colors.primary }
          ]}
          onPress={() => {
            TTSService.stop();
            setIsReadingAudio(false);
            setActiveMode('worship');
          }}
          accessibilityRole="button"
          accessibilityLabel={t.bookTab.worshipBook}
        >
          <Bookmark
            size={scaledFontSize(16)}
            color={activeMode === 'worship' ? colors.primaryText : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentedButtonText,
              {
                color: activeMode === 'worship' ? colors.primaryText : colors.textSecondary,
                fontSize: scaledFontSize(13)
              }
            ]}
          >
            {t.bookTab.worshipBook}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Visualização Ativa */}
      {activeMode === 'bible' ? (
        <BibleReader />
      ) : loading ? (
        <View style={[styles.centerLoading, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingLabel, { color: colors.textSecondary }]}>
            {t.common.loading}
          </Text>
        </View>
      ) : localizedCultos.length === 0 ? (
        <View style={[styles.centerLoading, { backgroundColor: colors.background, padding: 32 }]}>
          <Bookmark size={scaledFontSize(48)} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text, fontSize: scaledFontSize(18) }]}>
            {t.worship.noWorships}
          </Text>
          <Text style={[styles.emptySub, { color: colors.textMuted, fontSize: scaledFontSize(14) }]}>
            {t.bookTab.worshipDescription}
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Cabeçalho do Livro */}
          <View style={[styles.bookTopBar, { borderBottomColor: colors.border }]}>
            <View style={styles.chapterTag}>
              <Bookmark size={scaledFontSize(14)} color={colors.primary} />
              <Text style={[styles.chapterTagText, { color: colors.primary, fontSize: scaledFontSize(12) }]}>
                {t.bookTab.chapterOf
                  .replace('{current}', String(currentIndex + 1))
                  .replace('{total}', String(localizedCultos.length))}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.audioPill, { backgroundColor: isReadingAudio ? colors.danger : colors.surfaceElevated }]}
              onPress={handleToggleAudio}
              accessibilityLabel={isReadingAudio ? t.bookTab.stopAudio : t.bookTab.readAloud}
              accessibilityRole="button"
            >
              {isReadingAudio ? (
                <VolumeX size={scaledFontSize(16)} color="#FFFFFF" />
              ) : (
                <Volume2 size={scaledFontSize(16)} color={colors.secondary} />
              )}
              <Text
                style={[
                  styles.audioPillText,
                  { color: isReadingAudio ? '#FFFFFF' : colors.text, fontSize: scaledFontSize(12) }
                ]}
              >
                {isReadingAudio ? t.bookTab.stopAudio : t.bookTab.readAloud}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Conteúdo da Página do Livro */}
          <ScrollView ref={scrollViewRef} contentContainerStyle={styles.bookPage}>
            {/* Título do Capítulo */}
            <Text style={[styles.pageTitle, { color: colors.text, fontSize: scaledFontSize(22) }]}>
              {currentCulto?.title}
            </Text>

            {/* Metadados do Capítulo */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <User size={scaledFontSize(14)} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary, fontSize: scaledFontSize(13) }]}>
                  {currentCulto?.preacher}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Calendar size={scaledFontSize(14)} color={colors.accent} />
                <Text style={[styles.metaText, { color: colors.accent, fontSize: scaledFontSize(13) }]}>
                  {currentCulto?.service_date}
                </Text>
              </View>
            </View>

            {/* Resumo em Destaque (com versículos clicáveis se houver) */}
            {currentCulto?.summary ? (
              <View style={[styles.summaryBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}>
                <Text style={[styles.summaryTitle, { color: colors.primary, fontSize: scaledFontSize(12) }]}>
                  {t.bookTab.teachingSummary}
                </Text>
                <Text style={[styles.summaryBody, { color: colors.text, fontSize: scaledFontSize(14) }]}>
                  {summarySegments.map((seg, idx) =>
                    seg.type === 'verse' && seg.verse ? (
                      <Text
                        key={`sum-v-${idx}`}
                        onPress={() => setSelectedVerseModal(seg.verse!)}
                        style={[
                          styles.inlineVerseHighlight,
                          { color: colors.accent, backgroundColor: colors.accent + '22' }
                        ]}
                      >
                        {' 📖 '}{seg.content}{' '}
                      </Text>
                    ) : (
                      <Text key={`sum-t-${idx}`}>{seg.content}</Text>
                    )
                  )}
                </Text>
              </View>
            ) : null}

            {/* Texto Integral da Página com Citações Bíblicas Destacadas e Clicáveis */}
            {transcriptParagraphs.length > 0 ? (
              <View style={styles.paragraphsWrap}>
                {transcriptParagraphs.map((segments, pIdx) => (
                  <Text
                    key={`p-${pIdx}`}
                    style={[styles.pageBody, { color: colors.text, fontSize: scaledFontSize(16) }]}
                  >
                    {segments.map((seg, sIdx) =>
                      seg.type === 'verse' && seg.verse ? (
                        <Text
                          key={`v-${pIdx}-${sIdx}`}
                          onPress={() => setSelectedVerseModal(seg.verse!)}
                          style={[
                            styles.inlineVerseHighlight,
                            { color: colors.accent, backgroundColor: colors.accent + '22' }
                          ]}
                        >
                          {' 📖 '}{seg.content}{' '}
                        </Text>
                      ) : (
                        <Text key={`t-${pIdx}-${sIdx}`}>{seg.content}</Text>
                      )
                    )}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={[styles.pageBody, { color: colors.textMuted, fontSize: scaledFontSize(16) }]}>
                {t.bookTab.noTranscript}
              </Text>
            )}

            {/* Rodapé do Capítulo: Livros & Versículos Bíblicos Citados no Culto */}
            {chapterVerses.length > 0 ? (
              <View style={[styles.citedSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.citedHeaderRow}>
                  <Sparkles size={scaledFontSize(16)} color={colors.accent} />
                  <Text style={[styles.citedSectionTitle, { color: colors.accent, fontSize: scaledFontSize(14) }]}>
                    {t.bookTab.citedVersesTitle.replace('{count}', String(chapterVerses.length))}
                  </Text>
                </View>

                {/* Resumo em chips dos livros bíblicos citados */}
                {citedBooksSummary.length > 0 ? (
                  <View style={styles.citedBooksWrap}>
                    <Text style={[styles.citedBooksLabel, { color: colors.textSecondary, fontSize: scaledFontSize(12) }]}>
                      {t.bookTab.citedBooksLabel}
                    </Text>
                    <View style={styles.citedBooksChips}>
                      {citedBooksSummary.map(item => (
                        <TouchableOpacity
                          key={item.book}
                          activeOpacity={0.75}
                          onPress={() => setSelectedVerseModal(item.firstVerse)}
                          style={[
                            styles.citedBookChip,
                            { backgroundColor: colors.accent + '1E', borderColor: colors.accent }
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={item.book}
                        >
                          <BookOpen size={scaledFontSize(12)} color={colors.accent} />
                          <Text style={[styles.citedBookChipText, { color: colors.accent, fontSize: scaledFontSize(12) }]}>
                            {item.book}
                            {item.count > 1 ? ` (${item.count})` : ''}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Cards individuais dos versículos citados */}
                <View style={{ marginTop: 4 }}>
                  {chapterVerses.map((v, idx) => (
                    <VerseCard
                      key={`${v.book}-${v.chapter}-${v.verse_start}-${v.verse_end || ''}-${idx}`}
                      verse={v}
                      targetLang={language}
                      onPress={setSelectedVerseModal}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {/* Anotações Registradas no Capítulo */}
            {notes.length > 0 ? (
              <View style={styles.notesSection}>
                <Text style={[styles.notesSectionTitle, { color: colors.textSecondary, fontSize: scaledFontSize(14) }]}>
                  {t.bookTab.chapterNotes.replace('{count}', String(notes.length))}
                </Text>
                {notes.map(n => (
                  <View
                    key={n.id}
                    style={[
                      styles.noteItem,
                      { backgroundColor: colors.surface, borderLeftColor: n.color_tag || colors.accent }
                    ]}
                  >
                    <Text style={[styles.noteQuote, { color: colors.textMuted, fontSize: scaledFontSize(12) }]}>
                      "{n.selected_text}"
                    </Text>
                    <Text style={[styles.noteText, { color: colors.text, fontSize: scaledFontSize(14) }]}>
                      {n.note_text}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>

          {/* Modal de Leitura e Áudio do Versículo Citado */}
          <VerseDetailModal
            verse={selectedVerseModal}
            onClose={() => setSelectedVerseModal(null)}
            onReadAloud={handleReadAloudVerse}
            colors={colors}
            scaledFontSize={scaledFontSize}
          />

          {/* Controles de Navegação de Página na Thumb Zone */}
          <View
            style={[
              styles.bookThumbZone,
              {
                backgroundColor: colors.thumbZoneBackground,
                borderTopColor: colors.border,
                paddingBottom: insets.bottom + 10
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.pageTurnButton,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                currentIndex === 0 && styles.disabledTurnButton
              ]}
              onPress={handlePrevPage}
              disabled={currentIndex === 0}
              accessibilityLabel={t.bookTab.prevPage}
              accessibilityRole="button"
            >
              <ChevronLeft size={scaledFontSize(20)} color={currentIndex === 0 ? colors.textMuted : colors.text} />
              <Text
                style={[
                  styles.turnButtonText,
                  { color: currentIndex === 0 ? colors.textMuted : colors.text, fontSize: scaledFontSize(14) }
                ]}
              >
                {t.bookTab.prevPage}
              </Text>
            </TouchableOpacity>

            <View style={[styles.pageBadge, { backgroundColor: colors.surface }]}>
              <Text style={[styles.pageBadgeText, { color: colors.text, fontSize: scaledFontSize(13) }]}>
                {t.bookTab.pageOf
                  .replace('{current}', String(currentIndex + 1))
                  .replace('{total}', String(localizedCultos.length))}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.pageTurnButton,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                currentIndex >= localizedCultos.length - 1 && styles.disabledTurnButton
              ]}
              onPress={handleNextPage}
              disabled={currentIndex >= localizedCultos.length - 1}
              accessibilityLabel={t.bookTab.nextPage}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.turnButtonText,
                  {
                    color: currentIndex >= localizedCultos.length - 1 ? colors.textMuted : colors.text,
                    fontSize: scaledFontSize(14)
                  }
                ]}
              >
                {t.bookTab.nextPage}
              </Text>
              <ChevronRight
                size={scaledFontSize(20)}
                color={currentIndex >= localizedCultos.length - 1 ? colors.textMuted : colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  topSegmentedWrap: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6
  },
  segmentedButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderRadius: 10
  },
  segmentedButtonText: {
    fontWeight: '700'
  },
  bookTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1
  },
  chapterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  chapterTagText: {
    fontWeight: '700'
  },
  audioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6
  },
  audioPillText: {
    fontWeight: '600'
  },
  bookPage: {
    padding: 20,
    gap: 14,
    paddingBottom: 40
  },
  pageTitle: {
    fontWeight: '800',
    lineHeight: 28
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center'
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  metaText: {
    fontWeight: '500'
  },
  summaryBox: {
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    gap: 4
  },
  summaryTitle: {
    fontWeight: '700',
    letterSpacing: 0.5
  },
  summaryBody: {
    lineHeight: 20
  },
  paragraphsWrap: {
    gap: 12,
    marginTop: 4
  },
  pageBody: {
    lineHeight: 27
  },
  inlineVerseHighlight: {
    fontWeight: '700',
    textDecorationLine: 'underline'
  },
  citedSection: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10
  },
  citedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  citedSectionTitle: {
    fontWeight: '700'
  },
  citedBooksWrap: {
    gap: 6
  },
  citedBooksLabel: {
    fontWeight: '600'
  },
  citedBooksChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  citedBookChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1
  },
  citedBookChipText: {
    fontWeight: '700'
  },
  notesSection: {
    marginTop: 12,
    gap: 8
  },
  notesSectionTitle: {
    fontWeight: '700'
  },
  noteItem: {
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    gap: 4
  },
  noteQuote: {
    fontStyle: 'italic'
  },
  noteText: {
    fontWeight: '500'
  },
  bookThumbZone: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1
  },
  pageTurnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4
  },
  disabledTurnButton: {
    opacity: 0.4
  },
  turnButtonText: {
    fontWeight: '600'
  },
  pageBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  pageBadgeText: {
    fontWeight: '600'
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },
  loadingLabel: {
    fontWeight: '500'
  },
  emptyTitle: {
    fontWeight: '700'
  },
  emptySub: {
    textAlign: 'center'
  }
});
