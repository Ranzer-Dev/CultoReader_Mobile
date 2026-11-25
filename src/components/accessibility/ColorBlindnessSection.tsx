import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye } from 'lucide-react-native';
import { ColorBlindnessType } from '../../types';
import { ThemeColors } from '../../theme/tokens';
import { useLanguage } from '../../i18n';

interface ColorBlindnessSectionProps {
  currentColorBlindness: ColorBlindnessType;
  onSelectColorBlindness: (type: ColorBlindnessType) => void;
  colors: ThemeColors;
  scaledFontSize: (size: number) => number;
}

export function ColorBlindnessSection({
  currentColorBlindness,
  onSelectColorBlindness,
  colors,
  scaledFontSize
}: ColorBlindnessSectionProps) {
  const { t } = useLanguage();

  const daltonismOptions: { label: string; type: ColorBlindnessType; desc: string }[] = [
    { label: t.accessibility.colorBlindnessNone, type: 'none', desc: t.accessibility.colorBlindnessNoneDesc },
    { label: t.accessibility.protanopia, type: 'protanopia', desc: t.accessibility.protanopiaDesc },
    { label: t.accessibility.deuteranopia, type: 'deuteranopia', desc: t.accessibility.deuteranopiaDesc },
    { label: t.accessibility.tritanopia, type: 'tritanopia', desc: t.accessibility.tritanopiaDesc },
    { label: t.accessibility.highContrast, type: 'high_contrast', desc: t.accessibility.highContrastDesc }
  ];

  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <Eye size={scaledFontSize(20)} color={colors.secondary} />
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaledFontSize(16) }]}>
          {t.accessibility.colorBlindness}
        </Text>
      </View>
      <Text style={[styles.sectionDesc, { color: colors.textSecondary, fontSize: scaledFontSize(13) }]}>
        {t.accessibility.colorBlindnessDescription}
      </Text>

      <View style={styles.daltonismList}>
        {daltonismOptions.map((opt) => {
          const isSelected = currentColorBlindness === opt.type;
          return (
            <TouchableOpacity
              key={opt.type}
              style={[
                styles.daltonismItem,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                isSelected && { borderColor: colors.primary, borderWidth: 2 }
              ]}
              onPress={() => onSelectColorBlindness(opt.type)}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
            >
              <View style={styles.daltonismItemHeader}>
                <Text style={[styles.daltonismLabel, { color: colors.text, fontSize: scaledFontSize(14) }]}>
                  {opt.label}
                </Text>
                {isSelected ? (
                  <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.activeBadgeText, { color: colors.primaryText, fontSize: scaledFontSize(11) }]}>
                      {t.common.active}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.daltonismDesc, { color: colors.textMuted, fontSize: scaledFontSize(12) }]}>
                {opt.desc}
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
  daltonismList: {
    gap: 8
  },
  daltonismItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4
  },
  daltonismItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  daltonismLabel: {
    fontWeight: '700'
  },
  activeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6
  },
  activeBadgeText: {
    fontWeight: '700'
  },
  daltonismDesc: {
    lineHeight: 16
  }
});
