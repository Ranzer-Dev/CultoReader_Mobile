import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Hand } from 'lucide-react-native';
import { ThemeColors } from '../../theme/tokens';
import { useLanguage } from '../../i18n';

interface SensoryAssistSectionProps {
  librasEnabled: boolean;
  onToggleLibras: () => void;
  colors: ThemeColors;
  scaledFontSize: (size: number) => number;
}

export function SensoryAssistSection({
  librasEnabled,
  onToggleLibras,
  colors,
  scaledFontSize
}: SensoryAssistSectionProps) {
  const { t } = useLanguage();

  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <Hand size={scaledFontSize(20)} color={colors.accent} />
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaledFontSize(16) }]}>
          {t.accessibility.deafSectionTitle}
        </Text>
      </View>

      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.toggleTitle, { color: colors.text, fontSize: scaledFontSize(14) }]}>
            {t.accessibility.librasSupport}
          </Text>
          <Text style={[styles.toggleDesc, { color: colors.textMuted, fontSize: scaledFontSize(12) }]}>
            {t.accessibility.librasDescription}
          </Text>
        </View>
        <Switch
          value={librasEnabled}
          onValueChange={onToggleLibras}
          trackColor={{ false: colors.surfaceElevated, true: colors.primary }}
          accessibilityLabel={t.accessibility.librasSupport}
        />
      </View>

      {librasEnabled ? (
        <View style={[styles.librasPreview, { backgroundColor: colors.surfaceElevated }]}>
          <Hand size={scaledFontSize(32)} color={colors.accent} />
          <Text style={[styles.librasText, { color: colors.text, fontSize: scaledFontSize(13) }]}>
            {t.accessibility.librasActivePreview}
          </Text>
        </View>
      ) : null}
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  toggleTitle: {
    fontWeight: '600'
  },
  toggleDesc: {
    lineHeight: 16,
    marginTop: 2
  },
  librasPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    marginTop: 6
  },
  librasText: {
    flex: 1,
    lineHeight: 18
  }
});
