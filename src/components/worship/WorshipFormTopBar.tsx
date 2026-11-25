import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { ThemeColors } from '../../theme/tokens';
import { useLanguage } from '../../i18n';

interface WorshipFormTopBarProps {
  isEditing: boolean;
  onBack: () => void;
  colors: ThemeColors;
  scaledFontSize: (size: number) => number;
}

export function WorshipFormTopBar({
  isEditing,
  onBack,
  colors,
  scaledFontSize
}: WorshipFormTopBarProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.topBar}>
      <TouchableOpacity
        onPress={onBack}
        style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        accessibilityLabel={t.common.back}
        accessibilityRole="button"
      >
        <ArrowLeft size={scaledFontSize(20)} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.topBarTitle, { color: colors.text, fontSize: scaledFontSize(18) }]}>
        {isEditing ? t.worship.editWorship : t.worship.registerWorship}
      </Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1
  },
  topBarTitle: {
    fontWeight: '700'
  }
});
