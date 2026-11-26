import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { CheckCircle2, BookOpen, Mic, Sparkles } from 'lucide-react-native';
import { TextSegment } from '../../utils/transcriptParser';
import { DetectedVerse } from '../../types';
import { VerseCard } from '../VerseCard';
import { ThemeColors } from '../../theme/tokens';

interface LiveTranscriptViewProps {
  segments: TextSegment[];
  activeDisplayText: string;
  activeVerses: DetectedVerse[];
  saveStatusMessage: string;
  isListening: boolean;
  isVersesSectionExpanded: boolean;
  targetLang?: string;
  onToggleVersesExpanded: () => void;
  onWordClick: (word: string) => void;
  onVerseClick: (verse: DetectedVerse) => void;
  colors: ThemeColors;
  scaledFontSize: (size: number) => number;
}

export const LiveTranscriptView = React.memo(function LiveTranscriptView({
  segments,
  activeDisplayText,
  activeVerses,
  saveStatusMessage,
  isListening,
  isVersesSectionExpanded,
  targetLang,
  onToggleVersesExpanded,
  onWordClick,
  onVerseClick,
  colors,
  scaledFontSize
}: LiveTranscriptViewProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <View style={{ flex: 1 }}>
      {/* Barra de Status do Auto-Save SQLite */}
      <View style={[styles.statusBanner, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <CheckCircle2 size={scaledFontSize(14)} color={colors.success} />
        <Text
          style={[styles.statusBannerText, { color: colors.textSecondary, fontSize: scaledFontSize(11) }]}
          numberOfLines={1}
        >
          {saveStatusMessage}
        </Text>
      </View>

      {/* Área de Transcrição Central com Hiperlinks Bíblicos */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.transcriptArea}
        contentContainerStyle={styles.transcriptContent}
        onContentSizeChange={() => {
          if (isListening) {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        }}
      >
        {segments.length > 0 && activeDisplayText.trim().length > 0 ? (
          <View style={styles.wordsWrap}>
            {segments.map((segment, segIdx) => {
              if (segment.type === 'verse' && segment.verse) {
                const verse = segment.verse;
                return (
                  <TouchableOpacity
                    key={`verse-${segIdx}`}
                    onPress={() => onVerseClick(verse)}
                    activeOpacity={0.7}
                    style={[
                      styles.verseHyperlinkPill,
                      {
                        backgroundColor: colors.accent + '22',
                        borderColor: colors.accent
                      }
                    ]}
                    accessibilityLabel={`Hiperlink bíblico: ${verse.book} ${verse.chapter}:${verse.verse_start}. Toque para abrir.`}
                    accessibilityRole="link"
                  >
                    <BookOpen size={scaledFontSize(13)} color={colors.accent} style={{ marginRight: 4 }} />
                    <Text
                      style={[
                        styles.verseHyperlinkText,
                        {
                          color: colors.accent,
                          fontSize: scaledFontSize(15)
                        }
                      ]}
                    >
                      {segment.content}
                    </Text>
                  </TouchableOpacity>
                );
              }

              // Segmento normal de texto: renderizado com Text inline de alto desempenho (evita milhares de nós de toque nativos)
              // Remove ponto/vírgula órfão solto no início de um segmento imediatamente após uma pill de versículo
              const prevWasVerse = segIdx > 0 && segments[segIdx - 1]?.type === 'verse';
              const cleanedContent = prevWasVerse
                ? segment.content.replace(/^\s*[.,;:]+\s*/, ' ').trim()
                : segment.content;
              if (!cleanedContent) return null;
              const words = cleanedContent.split(' ');
              return (
                <Text key={`seg-${segIdx}`} style={[styles.transcriptWord, { color: colors.text, fontSize: scaledFontSize(17) }]}>
                  {words.map((word, wIdx) => {
                    if (!word) return null;
                    return (
                      <Text
                        key={`w-${segIdx}-${wIdx}`}
                        onPress={() => onWordClick(word)}
                        style={{ color: colors.text }}
                      >
                        {word}{' '}
                      </Text>
                    );
                  })}
                </Text>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyPrompt}>
            <Mic size={scaledFontSize(48)} color={colors.textMuted} />
            <Text style={[styles.emptyPromptTitle, { color: colors.textSecondary, fontSize: scaledFontSize(16) }]}>
              A palavra ainda não começou
            </Text>
            <Text style={[styles.emptyPromptSub, { color: colors.textMuted, fontSize: scaledFontSize(13) }]}>
              Toque no microfone na base da tela para iniciar a gravação. As citações bíblicas virarão hiperlinks automáticos!
            </Text>
          </View>
        )}

        {/* Seção Colapsável de Textos Bíblicos Identificados */}
        {activeVerses.length > 0 ? (
          <View style={[styles.detectedSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.sectionTitleRow}
              onPress={onToggleVersesExpanded}
              activeOpacity={0.7}
              accessibilityLabel={`Textos Bíblicos Identificados (${activeVerses.length}). Toque para ${isVersesSectionExpanded ? 'recolher' : 'expandir'}.`}
              accessibilityRole="button"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Sparkles size={scaledFontSize(16)} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.accent, fontSize: scaledFontSize(14) }]}>
                  Textos Bíblicos Identificados ({activeVerses.length})
                </Text>
              </View>
              <Text style={{ color: colors.accent, fontSize: scaledFontSize(12), fontWeight: '700' }}>
                {isVersesSectionExpanded ? '▲ Recolher' : '▼ Ver Lista'}
              </Text>
            </TouchableOpacity>

            {isVersesSectionExpanded ? (
              <View style={{ marginTop: 8 }}>
                {activeVerses.map((v, i) => (
                  <VerseCard
                    key={i}
                    verse={v}
                    targetLang={targetLang}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6
  },
  statusBannerText: {
    fontWeight: '600'
  },
  transcriptArea: {
    flex: 1
  },
  transcriptContent: {
    padding: 16,
    paddingBottom: 24
  },
  wordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  wordTouchable: {
    paddingVertical: 2
  },
  transcriptWord: {
    lineHeight: 28
  },
  verseHyperlinkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 7,
    borderWidth: 1,
    marginVertical: 1,
    marginHorizontal: 2,
    minHeight: 26
  },
  verseHyperlinkText: {
    fontWeight: '700',
    lineHeight: 22
  },
  emptyPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12
  },
  emptyPromptTitle: {
    fontWeight: '700'
  },
  emptyPromptSub: {
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18
  },
  detectedSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 20
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectionTitle: {
    fontWeight: '700'
  }
});
