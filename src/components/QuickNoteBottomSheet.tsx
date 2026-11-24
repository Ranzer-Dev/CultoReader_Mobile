import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Save, X, Edit3 } from 'lucide-react-native';
import { useAccessibility } from '../context/AccessibilityContext';

interface QuickNoteBottomSheetProps {
  visible: boolean;
  selectedText: string;
  onClose: () => void;
  onSave: (noteText: string, colorTag: string) => Promise<void>;
}

const COLOR_OPTIONS = ['#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#9B5DE5'];

export const QuickNoteBottomSheet: React.FC<QuickNoteBottomSheetProps> = ({
  visible,
  selectedText,
  onClose,
  onSave
}) => {
  const { colors, scaledFontSize } = useAccessibility();
  const [noteText, setNoteText] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!noteText.trim()) return;
    setIsSaving(true);
    try {
      await onSave(noteText.trim(), selectedColor);
      setNoteText('');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.sheetContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header da Thumb Zone */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <Edit3 size={scaledFontSize(18)} color={colors.accent} />
              <Text style={[styles.sheetTitle, { color: colors.text, fontSize: scaledFontSize(16) }]}>
                Anotação Rápida
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={scaledFontSize(20)} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Trecho selecionado */}
          {selectedText ? (
            <View style={[styles.quoteBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.quoteLabel, { color: colors.textMuted, fontSize: scaledFontSize(12) }]}>
                Trecho selecionado:
              </Text>
              <Text
                style={[styles.quoteText, { color: colors.text, fontSize: scaledFontSize(13) }]}
                numberOfLines={2}
              >
                "{selectedText}"
              </Text>
            </View>
          ) : null}

          {/* Campo de Anotação */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                color: colors.text,
                fontSize: scaledFontSize(14)
              }
            ]}
            placeholder="Digite sua reflexão ou anotação do culto..."
            placeholderTextColor={colors.textMuted}
            value={noteText}
            onChangeText={setNoteText}
            multiline
            numberOfLines={3}
          />

          {/* Seletor de cores da anotação */}
          <View style={styles.colorsRow}>
            <Text style={[styles.colorLabel, { color: colors.textSecondary, fontSize: scaledFontSize(13) }]}>
              Destaque:
            </Text>
            {COLOR_OPTIONS.map(c => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  selectedColor === c && styles.colorDotSelected
                ]}
                onPress={() => setSelectedColor(c)}
              />
            ))}
          </View>

          {/* Botão de Salvar na Thumb Zone */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary },
              (!noteText.trim() || isSaving) && styles.saveButtonDisabled
            ]}
            disabled={!noteText.trim() || isSaving}
            onPress={handleSave}
            accessibilityLabel="Salvar anotação"
            accessibilityRole="button"
          >
            <Save size={scaledFontSize(18)} color={colors.primaryText} />
            <Text style={[styles.saveButtonText, { color: colors.primaryText, fontSize: scaledFontSize(15) }]}>
              {isSaving ? 'Salvando...' : 'Salvar no Culto'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)'
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    gap: 14,
    maxHeight: '80%'
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  sheetTitle: {
    fontWeight: '700'
  },
  closeButton: {
    padding: 4
  },
  quoteBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4
  },
  quoteLabel: {
    fontWeight: '600'
  },
  quoteText: {
    fontStyle: 'italic'
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 80
  },
  colorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  colorLabel: {
    fontWeight: '500'
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.2 }]
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 4
  },
  saveButtonDisabled: {
    opacity: 0.5
  },
  saveButtonText: {
    fontWeight: '700'
  }
});

