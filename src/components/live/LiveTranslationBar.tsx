import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowRight, Languages } from 'lucide-react-native';
import { ThemeColors } from '../../theme/tokens';
import { LanguageInfo } from '../../i18n';

interface LiveTranslationBarProps {
  speakerLocale: string;
  targetLang: string;
  languages: LanguageInfo[];
  isTranslationActive: boolean;
  isTranslating: boolean;
  isOfflineReady: boolean;
  isDownloadingModel: boolean;
  viewMode: 'translated' | 'original';
  autoSpeakEarphones?: boolean;
  onToggleSpeakerPicker: () => void;
  onToggleTargetPicker: () => void;
  onToggleViewMode: () => void;
  onToggleAutoSpeakEarphones?: () => void;
  onDownloadModel: () => void;
  colors: ThemeColors;
  scaledFontSize: (size: number) => number;
}

export function LiveTranslationBar({
  speakerLocale,
  targetLang,
  languages,
  isTranslationActive,
  isTranslating,
  isOfflineReady,
  isDownloadingModel,
  viewMode,
  autoSpeakEarphones = false,
  onToggleSpeakerPicker,
  onToggleTargetPicker,
  onToggleViewMode,
  onToggleAutoSpeakEarphones,
  onDownloadModel,
  colors,
  scaledFontSize
}: LiveTranslationBarProps) {
  const speakerLangObj = languages.find((l) => l.speechLocale === speakerLocale);
  const targetLangObj = languages.find((l) => l.code === targetLang);

  return (
    <View style={[styles.translationBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <View style={styles.translationRow}>
        {/* Seletor do Idioma do Pregador (Microfone) */}
        <TouchableOpacity
          style={[styles.transPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={onToggleSpeakerPicker}
          accessibilityLabel="Selecionar idioma do pregador"
        >
          <Text style={[styles.transPillText, { color: colors.text, fontSize: scaledFontSize(12) }]}>
            🎙️ {speakerLangObj?.flag || '🇧🇷'} {speakerLangObj?.name || 'Português'}
          </Text>
          <Text style={{ fontSize: 10, color: colors.textMuted }}>▾</Text>
        </TouchableOpacity>

        <ArrowRight size={14} color={colors.primary} />

        {/* Seletor do Idioma de Tradução (Texto na tela) */}
        <TouchableOpacity
          style={[styles.transPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={onToggleTargetPicker}
          accessibilityLabel="Selecionar idioma de leitura da transcrição"
        >
          <Text style={[styles.transPillText, { color: colors.text, fontSize: scaledFontSize(12) }]}>
            📝 {targetLangObj?.flag || '🇺🇸'} {targetLangObj?.name || 'Inglês'}
          </Text>
          <Text style={{ fontSize: 10, color: colors.textMuted }}>▾</Text>
        </TouchableOpacity>
      </View>

      {/* Status de Tradução e Alternador de Visão */}
      {isTranslationActive && (
        <View style={styles.translationSubRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Languages size={14} color={colors.accent} />
            <Text style={{ color: colors.accent, fontSize: scaledFontSize(11), fontWeight: '600' }}>
              {isTranslating ? 'Traduzindo ao vivo...' : 'Tradução Ativa'}
            </Text>
            {!isOfflineReady && (
              <TouchableOpacity onPress={onDownloadModel} style={{ marginLeft: 4 }}>
                <Text style={{ color: colors.accent, fontSize: scaledFontSize(11), fontWeight: '700', textDecorationLine: 'underline' }}>
                  {isDownloadingModel ? '• Baixando tradutor...' : '• 📥 Baixar tradutor'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {onToggleAutoSpeakEarphones && (
              <TouchableOpacity
                style={[
                  styles.viewModeButton,
                  {
                    backgroundColor: autoSpeakEarphones ? colors.accent : colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1
                  }
                ]}
                onPress={onToggleAutoSpeakEarphones}
                accessibilityLabel="Ativar ou desativar áudio no fone de ouvido para o estrangeiro"
              >
                <Text
                  style={{
                    color: autoSpeakEarphones ? '#FFFFFF' : colors.text,
                    fontSize: scaledFontSize(11),
                    fontWeight: '700'
                  }}
                >
                  {autoSpeakEarphones ? '🎧 Fone: Ligado' : '🎧 Fone: Desligado'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.viewModeButton, { backgroundColor: colors.primary }]}
              onPress={onToggleViewMode}
              accessibilityLabel="Alternar entre áudio original e tradução"
            >
              <Text style={{ color: colors.primaryText, fontSize: scaledFontSize(11), fontWeight: '700' }}>
                {viewMode === 'translated' ? 'Ver Original' : 'Ver Tradução'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  translationBar: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  transPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1
  },
  transPillText: {
    fontWeight: '700'
  },
  translationSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#00000015'
  },
  viewModeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8
  }
});
