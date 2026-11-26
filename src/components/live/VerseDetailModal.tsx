import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { BookOpen, X, Volume2 } from 'lucide-react-native';
import { DetectedVerse } from '../../types';
import { ThemeColors } from '../../theme/tokens';
import { useLanguage } from '../../i18n';

interface VerseDetailModalProps {
  verse: DetectedVerse | null;
  onClose: () => void;
  onReadAloud: (verse: DetectedVerse) => void;
  colors: ThemeColors;
  scaledFontSize: (size: number) => number;
}

export function VerseDetailModal({
  verse,
  onClose,
  onReadAloud,
  colors,
  scaledFontSize
}: VerseDetailModalProps) {
  const { t } = useLanguage();
  if (!verse) return null;

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <BookOpen size={scaledFontSize(20)} color={colors.accent} />
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: scaledFontSize(17) }]}>
                {verse.book} {verse.chapter}:{verse.verse_start}
                {verse.verse_end ? `-${verse.verse_end}` : ''} ({verse.version_code})
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalCloseButton, { backgroundColor: colors.surfaceElevated }]}
              accessibilityLabel={t.common.close}
            >
              <X size={scaledFontSize(18)} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {verse.full_text ? (
              <Text style={[styles.modalVerseText, { color: colors.text, fontSize: scaledFontSize(16) }]}>
                "{verse.full_text}"
              </Text>
            ) : (
              <Text style={[styles.modalVerseTextEmpty, { color: colors.textMuted, fontSize: scaledFontSize(14) }]}>
                {t.bookTab.citedReferenceFallback}
              </Text>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => onReadAloud(verse)}
              accessibilityLabel={t.bookTab.listenVerse}
            >
              <Volume2 size={scaledFontSize(16)} color="#FFFFFF" />
              <Text style={[styles.modalButtonText, { color: '#FFFFFF', fontSize: scaledFontSize(13) }]}>
                {t.bookTab.listenVerse}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.surfaceElevated }]}
              onPress={onClose}
              accessibilityLabel={t.common.close}
            >
              <Text style={[styles.modalButtonText, { color: colors.text, fontSize: scaledFontSize(13) }]}>
                {t.common.close}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    gap: 12
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  modalTitle: {
    fontWeight: '800'
  },
  modalCloseButton: {
    padding: 6,
    borderRadius: 10
  },
  modalBody: {
    maxHeight: 250,
    marginVertical: 8
  },
  modalVerseText: {
    lineHeight: 24,
    fontStyle: 'italic'
  },
  modalVerseTextEmpty: {
    fontStyle: 'italic'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12
  },
  modalButtonText: {
    fontWeight: '700'
  }
});
