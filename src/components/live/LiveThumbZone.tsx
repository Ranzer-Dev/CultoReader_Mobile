import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Info, Send, Save, Mic, MicOff, BookOpen } from 'lucide-react-native';
import { ThemeColors } from '../../theme/tokens';

interface LiveThumbZoneProps {
  inputText: string;
  onChangeInputText: (text: string) => void;
  onSubmitInputText: () => void;
  isListening: boolean;
  hasText: boolean;
  onToggleListening: () => void;
  onOpenSaveModal: () => void;
  onOpenQuickNote: () => void;
  bottomInset: number;
  colors: ThemeColors;
  scaledFontSize: (size: number) => number;
}

export function LiveThumbZone({
  inputText,
  onChangeInputText,
  onSubmitInputText,
  isListening,
  hasText,
  onToggleListening,
  onOpenSaveModal,
  onOpenQuickNote,
  bottomInset,
  colors,
  scaledFontSize
}: LiveThumbZoneProps) {
  return (
    <>
      {/* Aviso informativo de áudio de fone / microfone */}
      <View style={[styles.audioNoticeBar, { backgroundColor: colors.surfaceElevated }]}>
        <Info size={scaledFontSize(13)} color={colors.textSecondary} />
        <Text style={[styles.audioNoticeText, { color: colors.textSecondary, fontSize: scaledFontSize(10.5) }]}>
          Capta fala no ambiente e fones de ouvido. Áudios internos do celular (ex: YouTube no fone) são bloqueados pelo Android.
        </Text>
      </View>

      {/* Campo de Entrada Manual / Ditado Alternativo */}
      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          style={[styles.inputField, { color: colors.text, fontSize: scaledFontSize(14) }]}
          placeholder="Fale ou digite (ex: Salmos 3:4, Filipenses 4:8)..."
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={onChangeInputText}
          onSubmitEditing={onSubmitInputText}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: inputText.trim() ? colors.primary : colors.surfaceElevated }
          ]}
          onPress={onSubmitInputText}
          disabled={!inputText.trim()}
          accessibilityLabel="Adicionar texto à transcrição"
          accessibilityRole="button"
        >
          <Send size={scaledFontSize(16)} color={inputText.trim() ? '#FFFFFF' : colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Thumb Zone Controls (Base da Tela) */}
      <View
        style={[
          styles.thumbZone,
          {
            backgroundColor: colors.thumbZoneBackground,
            borderTopColor: colors.border,
            paddingBottom: bottomInset + 12
          }
        ]}
      >
        <TouchableOpacity
          style={[styles.secondaryThumbButton, { backgroundColor: colors.surface }]}
          onPress={onOpenSaveModal}
          disabled={!hasText}
          accessibilityLabel="Salvar e editar detalhes do culto no SQLite"
          accessibilityRole="button"
        >
          <Save size={scaledFontSize(20)} color={hasText ? colors.success : colors.textMuted} />
          <Text
            style={[
              styles.secondaryThumbButtonText,
              { color: hasText ? colors.success : colors.textMuted, fontSize: scaledFontSize(13) }
            ]}
          >
            Salvar Culto
          </Text>
        </TouchableOpacity>

        {/* Botão Principal de Transcrição Contínua */}
        <TouchableOpacity
          style={[
            styles.micButton,
            { backgroundColor: isListening ? colors.danger : colors.primary }
          ]}
          onPress={onToggleListening}
          accessibilityLabel={isListening ? 'Parar gravação' : 'Iniciar gravação contínua'}
          accessibilityRole="button"
        >
          {isListening ? (
            <MicOff size={scaledFontSize(28)} color="#FFFFFF" />
          ) : (
            <Mic size={scaledFontSize(28)} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryThumbButton, { backgroundColor: colors.surface }]}
          onPress={onOpenQuickNote}
          accessibilityLabel="Adicionar observação rápida"
          accessibilityRole="button"
        >
          <BookOpen size={scaledFontSize(20)} color={colors.accent} />
          <Text style={[styles.secondaryThumbButtonText, { color: colors.accent, fontSize: scaledFontSize(13) }]}>
            Anotar
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  audioNoticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  audioNoticeText: {
    flex: 1,
    lineHeight: 14
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1
  },
  inputField: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'transparent'
  },
  sendButton: {
    padding: 8,
    borderRadius: 10
  },
  thumbZone: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1
  },
  secondaryThumbButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 4,
    minWidth: 90
  },
  secondaryThumbButtonText: {
    fontWeight: '700'
  },
  micButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  }
});
