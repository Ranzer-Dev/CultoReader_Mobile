import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BookOpen, Volume2 } from 'lucide-react-native';
import { DetectedVerse } from '../types';
import { useAccessibility } from '../context/AccessibilityContext';

interface VerseCardProps {
  verse: DetectedVerse;
  targetLang?: string;
}

export const VerseCard: React.FC<VerseCardProps> = ({ verse, targetLang }) => {
  const { colors, scaledFontSize, speakText } = useAccessibility();

  const handleSpeak = () => {
    const isEnglish = (targetLang === 'en' || (!targetLang && verse.version_code === 'KJV'));
    const isSpanish = (targetLang === 'es' || (!targetLang && verse.version_code === 'RVR1960'));
    const isFrench = (targetLang === 'fr' || (!targetLang && verse.version_code === 'LSG'));

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
    } else {
      speechContent = `${verse.book}, capítulo ${verse.chapter}, versículo ${verse.verse_start}. ${verse.full_text || ''}`;
    }

    speakText(speechContent, { language: lang });
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}>
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
          accessibilityLabel="Ouvir versículo em voz alta"
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
          (Referência citada no sermão)
        </Text>
      )}
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

