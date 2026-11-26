import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BookOpen, Volume2 } from 'lucide-react-native';
import { DetectedVerse } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../i18n';

interface VerseCardProps {
  verse: DetectedVerse;
  targetLang?: string;
  onPress?: (verse: DetectedVerse) => void;
}

export const VerseCard: React.FC<VerseCardProps> = ({ verse, targetLang, onPress }) => {
  const { colors, scaledFontSize, speakText } = useAccessibility();
  const { t } = useLanguage();

  const handleSpeak = () => {
    const cleanTarget = (targetLang || '').split('-')[0].toLowerCase();
    const isEnglish = cleanTarget === 'en' || (!cleanTarget && verse.version_code === 'KJV');
    const isSpanish = cleanTarget === 'es' || (!cleanTarget && (verse.version_code === 'RVR1960' || verse.version_code === 'RVR'));
    const isFrench = cleanTarget === 'fr' || (!cleanTarget && verse.version_code === 'LSG');
    const isSwahili = cleanTarget === 'sw' || (!cleanTarget && verse.version_code === 'SWA');

    let speechContent = '';
    let lang = 'pt-BR';
    if (isEnglish) {
      lang = 'en-US';
      speechContent = `${verse.book}, chapter ${verse.chapter}, verse ${verse.verse_start}. ${verse.full_text || ''}`;
    } else if (isSpanish) {
      lang = 'es-ES';
      speechContent = `${verse.book}, capítulo ${verse.chapter}, versículo ${verse.verse_start}. ${verse.full_text || ''}`;
    } else if (isFrench) {
      lang = 'fr-FR';
      speechContent = `${verse.book}, chapitre ${verse.chapter}, verset ${verse.verse_start}. ${verse.full_text || ''}`;
    } else if (isSwahili) {
      lang = 'sw-KE';
      speechContent = `${verse.book}, sura ${verse.chapter}, mstari ${verse.verse_start}. ${verse.full_text || ''}`;
    } else {
      speechContent = `${verse.book}, capítulo ${verse.chapter}, versículo ${verse.verse_start}. ${verse.full_text || ''}`;
    }

    speakText(speechContent, { language: lang });
  };

  const cardInner = (
    <>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <BookOpen size={scaledFontSize(16)} color={colors.primary} />
          <Text style={[styles.bookTitle, { color: colors.primary, fontSize: scaledFontSize(14) }]}>
            {verse.book} {verse.chapter}:{verse.verse_start}
            {verse.verse_end ? `-${verse.verse_end}` : ''} ({verse.version_code})
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSpeak}
          style={[styles.listenButton, { backgroundColor: colors.surface }]}
          accessibilityLabel={t.bookTab.listenVerse}
          accessibilityRole="button"
        >
          <Volume2 size={scaledFontSize(16)} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {verse.full_text ? (
        <Text style={[styles.verseText, { color: colors.text, fontSize: scaledFontSize(14) }]}>
          "{verse.full_text}"
        </Text>
      ) : (
        <Text style={[styles.verseTextEmpty, { color: colors.textMuted, fontSize: scaledFontSize(13) }]}>
          ({t.bookTab.citedReferenceFallback})
        </Text>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPress(verse)}
        style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}
        accessibilityRole="button"
      >
        {cardInner}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}>
      {cardInner}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    marginVertical: 6,
    gap: 6
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  bookTitle: {
    fontWeight: '700'
  },
  listenButton: {
    padding: 6,
    borderRadius: 8
  },
  verseText: {
    fontStyle: 'italic',
    lineHeight: 20
  },
  verseTextEmpty: {
    fontStyle: 'italic'
  }
});

