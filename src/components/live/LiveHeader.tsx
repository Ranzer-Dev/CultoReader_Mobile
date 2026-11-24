import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Volume2, Trash2 } from 'lucide-react-native';
import { LanguageSelectorButton } from '../LanguageSelectorButton';
import { ThemeColors } from '../../theme/tokens';

interface LiveHeaderProps {
  title: string;
  subtitle: string;
  isListening: boolean;
  hasText: boolean;
  onPlayTTS: () => void;
  onClear: () => void;
  colors: ThemeColors;
  scaledFontSize: (size: number) => number;
}

export function LiveHeader({
  title,
  subtitle,
  isListening,
  hasText,
  onPlayTTS,
  onClear,
  colors,
  scaledFontSize
}: LiveHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={[styles.screenTitle, { color: colors.text, fontSize: scaledFontSize(22) }]}>
          {title}
        </Text>
        <Text
          style={[
            styles.screenSubtitle,
            { color: isListening ? colors.accent : colors.textSecondary, fontSize: scaledFontSize(13) }
          ]}
        >
          {subtitle}
        </Text>
      </View>

      <View style={styles.headerActions}>
        <LanguageSelectorButton />

        <TouchableOpacity
          style={[styles.smallButton, { backgroundColor: colors.surfaceElevated }]}
          onPress={onPlayTTS}
          disabled={!hasText}
          accessibilityLabel="Ouvir transcrição completa"
          accessibilityRole="button"
        >
          <Volume2 size={scaledFontSize(18)} color={hasText ? colors.secondary : colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.smallButton, { backgroundColor: colors.surfaceElevated }]}
          onPress={onClear}
          disabled={!hasText}
          accessibilityLabel="Limpar texto"
          accessibilityRole="button"
        >
          <Trash2 size={scaledFontSize(18)} color={hasText ? colors.danger : colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  screenTitle: {
    fontWeight: '800'
  },
  screenSubtitle: {
    fontWeight: '600',
    marginTop: 2
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  smallButton: {
    padding: 8,
    borderRadius: 10
  }
});
