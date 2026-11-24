import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from 'react-native';
import { Save, X, BookOpen, User, Tag, FileText, Check } from 'lucide-react-native';
import { DetectedVerse } from '../../types';
import { ThemeColors } from '../../theme/tokens';

interface SaveWorshipModalProps {
  visible: boolean;
  onClose: () => void;
  isListening: boolean;
  title: string;
  onChangeTitle: (text: string) => void;
  preacher: string;
  onChangePreacher: (text: string) => void;
  tags: string;
  onChangeTags: (text: string) => void;
  summary: string;
  onChangeSummary: (text: string) => void;
  detectedVerses: DetectedVerse[];
  onConfirmSave: () => void;
  colors: ThemeColors;
  scaledFontSize: (size: number) => number;
}

export function SaveWorshipModal({
  visible,
  onClose,
  isListening,
  title,
  onChangeTitle,
  preacher,
  onChangePreacher,
  tags,
  onChangeTags,
  summary,
  onChangeSummary,
  detectedVerses,
  onConfirmSave,
  colors,
  scaledFontSize
}: SaveWorshipModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={[styles.saveModalCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Save size={scaledFontSize(20)} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: scaledFontSize(18) }]}>
                Salvar Detalhes do Culto
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalCloseButton, { backgroundColor: colors.surfaceElevated }]}
              accessibilityLabel="Fechar modal"
            >
              <X size={scaledFontSize(18)} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {isListening ? (
            <View style={[styles.liveActivePill, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
              <View style={styles.liveActiveDot} />
              <Text style={[styles.liveActiveText, { color: colors.success, fontSize: scaledFontSize(12) }]}>
                Gravação ativa em segundo plano (não foi desligada)
              </Text>
            </View>
          ) : null}

          <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 12 }}>
            {/* Tema / Título */}
            <View style={styles.modalInputGroup}>
              <View style={styles.labelRow}>
                <BookOpen size={scaledFontSize(14)} color={colors.primary} />
                <Text style={[styles.modalLabel, { color: colors.text, fontSize: scaledFontSize(13) }]}>
                  Título / Tema do Culto *
                </Text>
              </View>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                    color: colors.text,
                    fontSize: scaledFontSize(14)
                  }
                ]}
                placeholder="Ex: Filipenses 4 - A Paz de Deus"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={onChangeTitle}
              />
            </View>

            {/* Pastor / Preletor */}
            <View style={styles.modalInputGroup}>
              <View style={styles.labelRow}>
                <User size={scaledFontSize(14)} color={colors.accent} />
                <Text style={[styles.modalLabel, { color: colors.text, fontSize: scaledFontSize(13) }]}>
                  Pastor / Preletor
                </Text>
              </View>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                    color: colors.text,
                    fontSize: scaledFontSize(14)
                  }
                ]}
                placeholder="Ex: Pr. Lucas Ferreira"
                placeholderTextColor={colors.textMuted}
                value={preacher}
                onChangeText={onChangePreacher}
              />
            </View>

            {/* Tags */}
            <View style={styles.modalInputGroup}>
              <View style={styles.labelRow}>
                <Tag size={scaledFontSize(14)} color={colors.secondary} />
                <Text style={[styles.modalLabel, { color: colors.text, fontSize: scaledFontSize(13) }]}>
                  Tags / Categorias
                </Text>
              </View>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                    color: colors.text,
                    fontSize: scaledFontSize(14)
                  }
                ]}
                placeholder="Ex: Domingo, Palavra, Filipenses"
                placeholderTextColor={colors.textMuted}
                value={tags}
                onChangeText={onChangeTags}
              />
            </View>

            {/* Resumo da Mensagem */}
            <View style={styles.modalInputGroup}>
              <View style={styles.labelRow}>
                <FileText size={scaledFontSize(14)} color={colors.accent} />
                <Text style={[styles.modalLabel, { color: colors.text, fontSize: scaledFontSize(13) }]}>
                  Resumo da Mensagem
                </Text>
              </View>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                    color: colors.text,
                    fontSize: scaledFontSize(14),
                    minHeight: 70,
                    textAlignVertical: 'top'
                  }
                ]}
                placeholder="Ex: Mensagem sobre perseverança e fé..."
                placeholderTextColor={colors.textMuted}
                value={summary}
                onChangeText={onChangeSummary}
                multiline
                numberOfLines={3}
              />
            </View>

            {detectedVerses.length > 0 ? (
              <View style={[styles.detectedBadgeBox, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.detectedBadgeTitle, { color: colors.accent, fontSize: scaledFontSize(12) }]}>
                  Versículos catalogados nesta mensagem:
                </Text>
                <Text style={[styles.detectedBadgeText, { color: colors.text, fontSize: scaledFontSize(13) }]}>
                  {detectedVerses
                    .map((v) => `${v.book} ${v.chapter}:${v.verse_start}${v.verse_end ? '-' + v.verse_end : ''}`)
                    .join(', ')}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.surfaceElevated }]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: colors.text, fontSize: scaledFontSize(14) }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={onConfirmSave}
            >
              <Check size={scaledFontSize(16)} color={colors.primaryText} />
              <Text style={[styles.modalButtonText, { color: colors.primaryText, fontSize: scaledFontSize(14) }]}>
                Salvar no SQLite
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  saveModalCard: {
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
  liveActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1
  },
  liveActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981'
  },
  liveActiveText: {
    fontWeight: '600'
  },
  modalInputGroup: {
    gap: 4
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  modalLabel: {
    fontWeight: '700'
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  detectedBadgeBox: {
    padding: 10,
    borderRadius: 10,
    gap: 4
  },
  detectedBadgeTitle: {
    fontWeight: '700'
  },
  detectedBadgeText: {
    lineHeight: 18
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8
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
