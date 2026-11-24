import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Globe } from 'lucide-react-native';
import { SupportedLanguage } from '../../i18n';
import { ThemeColors } from '../../theme/tokens';

interface LanguageItem {
  code: SupportedLanguage;
  nativeName: string;
  flag: string;
}

interface AppLanguageSectionProps {
  currentLanguage: SupportedLanguage;
  languages: LanguageItem[];
  onSelectLanguage: (code: SupportedLanguage) => void;
  title: string;
  subtitle: string;
  colors: ThemeColors;
  scaledFontSize: (size: number) => number;
}

export function AppLanguageSection({
  currentLanguage,
  languages,
  onSelectLanguage,
  title,
  subtitle,
  colors,
  scaledFontSize
}: AppLanguageSectionProps) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <Globe size={scaledFontSize(20)} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaledFontSize(16) }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.sectionDesc, { color: colors.textSecondary, fontSize: scaledFontSize(13) }]}>
        {subtitle}
      </Text>

      <View style={styles.optionsWrap}>
        {languages.map((lang) => {
          const isSelected = currentLanguage === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.choiceButton,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => onSelectLanguage(lang.code)}
              accessibilityRole="button"
              accessibilityLabel={`Mudar idioma para ${lang.nativeName}`}
            >
              <Text
                style={[
                  styles.choiceButtonText,
                  { color: isSelected ? colors.primaryText : colors.text, fontSize: scaledFontSize(13) }
                ]}
              >
                {lang.flag} {lang.nativeName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  sectionTitle: {
    fontWeight: '700'
  },
  sectionDesc: {
    lineHeight: 18
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  choiceButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  choiceButtonText: {
    fontWeight: '600'
  }
});
