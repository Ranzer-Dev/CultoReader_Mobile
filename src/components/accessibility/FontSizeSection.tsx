import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Type } from 'lucide-react-native';
import { ThemeColors } from '../../theme/tokens';

interface FontSizeSectionProps {
  currentScale: number;
  onSelectScale: (scale: number) => void;
  colors: ThemeColors;
  scaledFontSize: (size: number) => number;
}

const FONT_OPTIONS = [
  { label: 'Normal (100%)', scale: 1.0 },
  { label: 'Médio (125%)', scale: 1.25 },
  { label: 'Grande (150%)', scale: 1.5 },
  { label: 'Extra Grande (175%)', scale: 1.75 },
  { label: 'Máximo (200%)', scale: 2.0 }
];

export function FontSizeSection({
  currentScale,
  onSelectScale,
  colors,
  scaledFontSize
}: FontSizeSectionProps) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <Type size={scaledFontSize(20)} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaledFontSize(16) }]}>
          Tamanho da Fonte no Aplicativo
        </Text>
      </View>
      <Text style={[styles.sectionDesc, { color: colors.textSecondary, fontSize: scaledFontSize(13) }]}>
        Aumenta a tipografia de todas as telas, botões, transcrições e menus simultaneamente.
      </Text>

      <View style={styles.optionsWrap}>
        {FONT_OPTIONS.map((opt) => {
          const isSelected = Math.abs(currentScale - opt.scale) < 0.05;
          return (
            <TouchableOpacity
              key={opt.scale}
              style={[
                styles.choiceButton,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => onSelectScale(opt.scale)}
              accessibilityRole="button"
              accessibilityLabel={`Tamanho de fonte ${opt.label}`}
            >
              <Text
                style={[
                  styles.choiceButtonText,
                  { color: isSelected ? colors.primaryText : colors.text, fontSize: scaledFontSize(13) }
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Prévia da Fonte */}
      <View style={[styles.previewBox, { backgroundColor: colors.surfaceElevated }]}>
        <Text style={[styles.previewLabel, { color: colors.textMuted, fontSize: scaledFontSize(11) }]}>
          PRÉVIA DO TEXTO ESCALADO:
        </Text>
        <Text style={[styles.previewText, { color: colors.text, fontSize: scaledFontSize(16) }]}>
          "O Senhor é o meu pastor; nada me faltará." (Salmos 23:1)
        </Text>
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
  },
  previewBox: {
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
    gap: 4
  },
  previewLabel: {
    fontWeight: '700',
    letterSpacing: 0.5
  },
  previewText: {
    fontStyle: 'italic',
    lineHeight: 22
  }
});
