import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/tokens';
import { LanguageInfo } from '../../i18n';

interface LiveLanguagePickersProps {
  showSpeakerPicker: boolean;
  showTargetPicker: boolean;
  speakerLocale: string;
  targetLang: string;
  languages: LanguageInfo[];
  onSelectSpeakerLocale: (locale: string) => void;
  onSelectTargetLang: (code: string) => void;
  colors: ThemeColors;
  scaledFontSize: (size: number) => number;
}

export function LiveLanguagePickers({
  showSpeakerPicker,
  showTargetPicker,
  speakerLocale,
  targetLang,
  languages,
  onSelectSpeakerLocale,
  onSelectTargetLang,
  colors,
  scaledFontSize
}: LiveLanguagePickersProps) {
  if (!showSpeakerPicker && !showTargetPicker) return null;

  return (
    <>
      {/* Seletor Dropdown: Idioma do Pregador (Microfone) */}
      {showSpeakerPicker && (
        <View style={[styles.langPickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.langPickerTitle, { color: colors.textSecondary, fontSize: scaledFontSize(11) }]}>
            O pregador está falando em:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langPillsWrap}>
            {languages.map((l) => {
              const isSelected = speakerLocale === l.speechLocale;
              return (
                <TouchableOpacity
                  key={`spk-${l.code}`}
                  style={[
                    styles.langPill,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => onSelectSpeakerLocale(l.speechLocale)}
                >
                  <Text
                    style={[
                      styles.langPillText,
                      { color: isSelected ? colors.primaryText : colors.text, fontSize: scaledFontSize(12) }
                    ]}
                  >
                    {l.flag} {l.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Seletor Dropdown: Idioma de Leitura (Tradução na Tela) */}
      {showTargetPicker && (
        <View style={[styles.langPickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.langPickerTitle, { color: colors.textSecondary, fontSize: scaledFontSize(11) }]}>
            Transcrever e traduzir para:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langPillsWrap}>
            {languages.map((l) => {
              const isSelected = targetLang === l.code;
              return (
                <TouchableOpacity
                  key={`tgt-${l.code}`}
                  style={[
                    styles.langPill,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => onSelectTargetLang(l.code)}
                >
                  <Text
                    style={[
                      styles.langPillText,
                      { color: isSelected ? colors.primaryText : colors.text, fontSize: scaledFontSize(12) }
                    ]}
                  >
                    {l.flag} {l.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  langPickerContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6
  },
  langPickerTitle: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  langPillsWrap: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2
  },
  langPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1
  },
  langPillText: {
    fontWeight: '600'
  }
});
