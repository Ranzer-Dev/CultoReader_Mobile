import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../i18n';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (newPage: number) => void;
  pageSize: number;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  onPageChange,
  pageSize
}) => {
  const { colors, scaledFontSize } = useAccessibility();
  const { t } = useLanguage();

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  const infoLabel =
    totalRecords === 0
      ? t.common.noRecordsFound
      : t.common.showingRecords
          .replace('{start}', String(startRecord))
          .replace('{end}', String(endRecord))
          .replace('{total}', String(totalRecords));

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.infoText, { color: colors.textSecondary, fontSize: scaledFontSize(13) }]}>
        {infoLabel}
      </Text>

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[
            styles.pageButton,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            currentPage <= 1 && styles.buttonDisabled
          ]}
          disabled={currentPage <= 1}
          onPress={() => onPageChange(currentPage - 1)}
          accessibilityLabel={t.common.previous}
          accessibilityRole="button"
        >
          <ChevronLeft size={scaledFontSize(18)} color={currentPage <= 1 ? colors.textMuted : colors.text} />
          <Text
            style={[
              styles.buttonText,
              { color: currentPage <= 1 ? colors.textMuted : colors.text, fontSize: scaledFontSize(14) }
            ]}
          >
            {t.common.previous}
          </Text>
        </TouchableOpacity>

        <View style={[styles.pageIndicator, { backgroundColor: colors.primary }]}>
          <Text style={[styles.pageIndicatorText, { color: colors.primaryText, fontSize: scaledFontSize(14) }]}>
            {currentPage} / {totalPages || 1}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.pageButton,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            currentPage >= totalPages && styles.buttonDisabled
          ]}
          disabled={currentPage >= totalPages}
          onPress={() => onPageChange(currentPage + 1)}
          accessibilityLabel={t.common.next}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.buttonText,
              { color: currentPage >= totalPages ? colors.textMuted : colors.text, fontSize: scaledFontSize(14) }
            ]}
          >
            {t.common.next}
          </Text>
          <ChevronRight
            size={scaledFontSize(18)}
            color={currentPage >= totalPages ? colors.textMuted : colors.text}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 8,
    alignItems: 'center',
    gap: 8
  },
  infoText: {
    fontWeight: '500'
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%'
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4
  },
  buttonDisabled: {
    opacity: 0.4
  },
  buttonText: {
    fontWeight: '600'
  },
  pageIndicator: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  pageIndicatorText: {
    fontWeight: '700'
  }
});
