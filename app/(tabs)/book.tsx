import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
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
import { WorshipService, WorshipNote } from '../../src/types';
import { TTSService } from '../../src/services/audio/TTSService';
import { BibleReader } from '../../src/components/bible/BibleReader';
import { LanguageSelectorButton } from '../../src/components/LanguageSelectorButton';

export default function BookModeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scaledFontSize, speakText } = useAccessibility();
  const { t } = useLanguage();

  const [activeMode, setActiveMode] = useState<'bible' | 'worship'>('bible');
  const [cultos, setCultos] = useState<WorshipService[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<WorshipNote[]>([]);
  const [isReadingAudio, setIsReadingAudio] = useState(false);

  const loadAllCultos = useCallback(async () => {
    setLoading(true);
    try {
      // Carrega cultos ordenados por data cronológica para compor o livro de mensagens
      const result = await WorshipRepository.findPaginated({
        page: 1,
        pageSize: 100
      });
      // Ordena cronologicamente para fluxo de leitura
      const sorted = [...result.data].sort((a, b) => a.service_date.localeCompare(b.service_date));
      setCultos(sorted);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAllCultos();
    }, [loadAllCultos])
  );

  const currentCulto: WorshipService | undefined = cultos[currentIndex];

  useEffect(() => {
    if (currentCulto) {
      NotesRepository.findByWorshipId(currentCulto.id).then(setNotes);
    } else {
      setNotes([]);
    }
    // Para áudio se mudar de página
    TTSService.stop();
    setIsReadingAudio(false);
  }, [currentCulto]);

  const handleNextPage = () => {
    if (currentIndex < cultos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleToggleAudio = async () => {
    if (isReadingAudio) {
      await TTSService.stop();
      setIsReadingAudio(false);
    } else if (currentCulto) {
      setIsReadingAudio(true);
      const content = `Capítulo ${currentIndex + 1}. ${currentCulto.title}. Pregador: ${currentCulto.preacher}. Data: ${currentCulto.service_date}. ${currentCulto.full_transcript || currentCulto.summary}`;
      await speakText(content);
      setIsReadingAudio(false);
    }
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
          onPress={() => setActiveMode('bible')}
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
          onPress={() => setActiveMode('worship')}
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
      ) : cultos.length === 0 ? (
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
            Capítulo {currentIndex + 1} de {cultos.length}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.audioPill, { backgroundColor: isReadingAudio ? colors.danger : colors.surfaceElevated }]}
          onPress={handleToggleAudio}
          accessibilityLabel={isReadingAudio ? 'Pausar leitura em voz alta' : 'Ler capítulo em voz alta'}
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
            {isReadingAudio ? 'Parar Áudio' : 'Ler em Voz Alta'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo da Página do Livro */}
      <ScrollView contentContainerStyle={styles.bookPage}>
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

        {/* Resumo em Destaque */}
        {currentCulto?.summary ? (
          <View style={[styles.summaryBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}>
            <Text style={[styles.summaryTitle, { color: colors.primary, fontSize: scaledFontSize(12) }]}>
              SÍNTESE DO ENSINAMENTO
            </Text>
            <Text style={[styles.summaryBody, { color: colors.text, fontSize: scaledFontSize(14) }]}>
              {currentCulto.summary}
            </Text>
          </View>
        ) : null}

        {/* Texto Integral da Página */}
        <Text style={[styles.pageBody, { color: colors.text, fontSize: scaledFontSize(16) }]}>
          {currentCulto?.full_transcript || '(Sem transcrição detalhada para este capítulo)'}
        </Text>

        {/* Anotações Registradas no Capítulo */}
        {notes.length > 0 ? (
          <View style={styles.notesSection}>
            <Text style={[styles.notesSectionTitle, { color: colors.textSecondary, fontSize: scaledFontSize(14) }]}>
              Anotações deste Capítulo ({notes.length})
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
          accessibilityLabel="Capítulo anterior"
          accessibilityRole="button"
        >
          <ChevronLeft size={scaledFontSize(20)} color={currentIndex === 0 ? colors.textMuted : colors.text} />
          <Text
            style={[
              styles.turnButtonText,
              { color: currentIndex === 0 ? colors.textMuted : colors.text, fontSize: scaledFontSize(14) }
            ]}
          >
            Pág. Anterior
          </Text>
        </TouchableOpacity>

        <View style={[styles.pageBadge, { backgroundColor: colors.surface }]}>
          <Text style={[styles.pageBadgeText, { color: colors.text, fontSize: scaledFontSize(13) }]}>
            Página {currentIndex + 1} de {cultos.length}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.pageTurnButton,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            currentIndex >= cultos.length - 1 && styles.disabledTurnButton
          ]}
          onPress={handleNextPage}
          disabled={currentIndex >= cultos.length - 1}
          accessibilityLabel="Próximo capítulo"
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.turnButtonText,
              {
                color: currentIndex >= cultos.length - 1 ? colors.textMuted : colors.text,
                fontSize: scaledFontSize(14)
              }
            ]}
          >
            Próxima Pág.
          </Text>
          <ChevronRight
            size={scaledFontSize(20)}
            color={currentIndex >= cultos.length - 1 ? colors.textMuted : colors.text}
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
  pageBody: {
    lineHeight: 26,
    marginTop: 6
  },
  notesSection: {
    marginTop: 20,
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

