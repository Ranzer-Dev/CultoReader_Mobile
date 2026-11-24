import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Volume2,
  Sparkles,
  Sliders,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Play
} from 'lucide-react-native';
import { HumanFriendlyVoice } from '../../services/audio/TTSService';
import { ThemeColors } from '../../theme/tokens';

interface VoiceSynthesisSectionProps {
  availableVoices: HumanFriendlyVoice[];
  selectedVoiceId: string;
  playingVoiceId: string | null;
  onSelectVoice: (voiceId: string) => void;
  onTestVoice: (voiceId: string) => void;
  onReloadVoices: () => void;
  onOpenTtsSettings: () => void;
  onOpenGoogleTtsStore: () => void;
  colors: ThemeColors;
  scaledFontSize: (size: number) => number;
}

export function VoiceSynthesisSection({
  availableVoices,
  selectedVoiceId,
  playingVoiceId,
  onSelectVoice,
  onTestVoice,
  onReloadVoices,
  onOpenTtsSettings,
  onOpenGoogleTtsStore,
  colors,
  scaledFontSize
}: VoiceSynthesisSectionProps) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <Volume2 size={scaledFontSize(20)} color={colors.accent} />
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaledFontSize(16) }]}>
          Voz de Leitura (Sintetizador TTS)
        </Text>
      </View>
      <Text style={[styles.sectionDesc, { color: colors.textSecondary, fontSize: scaledFontSize(13) }]}>
        Ouça as passagens bíblicas e transcrições com dicção clara e ritmo fluido.
      </Text>

      {/* Cartão de Ação: Como Deixar a Voz Mais Humana com 1 Clique */}
      <View style={[styles.humanVoiceCard, { backgroundColor: colors.accent + '14', borderColor: colors.accent }]}>
        <View style={styles.humanVoiceHeader}>
          <Sparkles size={scaledFontSize(18)} color={colors.accent} />
          <Text style={[styles.humanVoiceTitle, { color: colors.accent, fontSize: scaledFontSize(14) }]}>
            Como ativar a voz quase humana (Sem custo)
          </Text>
        </View>

        <Text style={[styles.humanVoiceText, { color: colors.text, fontSize: scaledFontSize(12.5) }]}>
          Por padrão, muitos celulares vêm com vozes mecânicas. Toque no botão abaixo para abrir direto os ajustes do Android, escolha "Serviços de Voz do Google" e baixe a Voz 2 ou Voz 4 (modelos neurais de alta qualidade):
        </Text>

        <View style={styles.actionButtonsWrap}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: colors.accent }]}
            onPress={onOpenTtsSettings}
            accessibilityLabel="Abrir configurações de voz do Android para ativar modelo humano"
            accessibilityRole="button"
          >
            <Sliders size={scaledFontSize(16)} color="#FFFFFF" />
            <Text style={[styles.primaryActionBtnText, { color: '#FFFFFF', fontSize: scaledFontSize(13) }]}>
              Abrir Configurações de Voz do Android
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryActionBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={onOpenGoogleTtsStore}
            accessibilityLabel="Atualizar aplicativo de vozes do Google na Play Store"
            accessibilityRole="button"
          >
            <ExternalLink size={scaledFontSize(15)} color={colors.primary} />
            <Text style={[styles.secondaryActionBtnText, { color: colors.primary, fontSize: scaledFontSize(12.5) }]}>
              Instalar / Atualizar Vozes do Google (Play Store)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de Vozes Detectadas com Nomes Amigáveis para Humanos */}
      <View style={{ marginTop: 14 }}>
        <View style={styles.voiceSectionHeaderRow}>
          <Text style={[styles.subSectionTitle, { color: colors.text, fontSize: scaledFontSize(14) }]}>
            Vozes Disponíveis no seu Celular:
          </Text>
          <TouchableOpacity
            style={[styles.reloadVoicesBtn, { backgroundColor: colors.surfaceElevated }]}
            onPress={onReloadVoices}
            accessibilityLabel="Recarregar vozes instaladas"
          >
            <RefreshCw size={scaledFontSize(13)} color={colors.textSecondary} />
            <Text style={[styles.reloadVoicesText, { color: colors.textSecondary, fontSize: scaledFontSize(11) }]}>
              Atualizar
            </Text>
          </TouchableOpacity>
        </View>

        {availableVoices.length > 0 ? (
          <View style={styles.voiceCardsList}>
            {availableVoices.map((v) => {
              const isSelected = selectedVoiceId === v.identifier;
              const isPlaying = playingVoiceId === v.identifier;
              return (
                <View
                  key={v.identifier}
                  style={[
                    styles.voiceCard,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                    isSelected && { borderColor: colors.accent, borderWidth: 2, backgroundColor: colors.accent + '0D' }
                  ]}
                >
                  <View style={styles.voiceCardInfo}>
                    <View style={styles.voiceCardTitleRow}>
                      <Text style={[styles.voiceCardDisplayName, { color: colors.text, fontSize: scaledFontSize(14) }]}>
                        {v.displayName}
                      </Text>
                      {v.badge ? (
                        <View style={[styles.voiceBadge, { backgroundColor: colors.accent }]}>
                          <Text style={[styles.voiceBadgeText, { color: '#FFFFFF', fontSize: scaledFontSize(10) }]}>
                            {v.badge}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.voiceCardDescription, { color: colors.textMuted, fontSize: scaledFontSize(12) }]}>
                      {v.description}
                    </Text>
                  </View>

                  <View style={styles.voiceCardActions}>
                    <TouchableOpacity
                      style={[
                        styles.voiceSelectBtn,
                        { backgroundColor: isSelected ? colors.accent : colors.surface },
                        isSelected ? null : { borderColor: colors.border, borderWidth: 1 }
                      ]}
                      onPress={() => onSelectVoice(v.identifier)}
                      accessibilityLabel={`Selecionar ${v.displayName}`}
                    >
                      {isSelected ? (
                        <CheckCircle2 size={scaledFontSize(14)} color="#FFFFFF" />
                      ) : null}
                      <Text
                        style={[
                          styles.voiceSelectBtnText,
                          { color: isSelected ? '#FFFFFF' : colors.text, fontSize: scaledFontSize(12) }
                        ]}
                      >
                        {isSelected ? 'Voz Ativa' : 'Selecionar'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.voiceTestBtn, { backgroundColor: isPlaying ? colors.success : colors.primary }]}
                      onPress={() => onTestVoice(v.identifier)}
                      accessibilityLabel={`Ouvir teste de ${v.displayName}`}
                    >
                      <Play size={scaledFontSize(12)} color="#FFFFFF" />
                      <Text style={[styles.voiceTestBtnText, { color: '#FFFFFF', fontSize: scaledFontSize(11.5) }]}>
                        {isPlaying ? 'Tocando...' : 'Ouvir Teste'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[styles.noVoicesBox, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.noVoicesText, { color: colors.textMuted, fontSize: scaledFontSize(13) }]}>
              Nenhuma voz foi carregada ainda. Toque em "Atualizar" ou configure o motor de voz do Google.
            </Text>
          </View>
        )}
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
  humanVoiceCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
    gap: 8
  },
  humanVoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  humanVoiceTitle: {
    fontWeight: '700'
  },
  humanVoiceText: {
    lineHeight: 18
  },
  actionButtonsWrap: {
    gap: 8,
    marginTop: 4
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12
  },
  primaryActionBtnText: {
    fontWeight: '700'
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1
  },
  secondaryActionBtnText: {
    fontWeight: '600'
  },
  voiceSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  subSectionTitle: {
    fontWeight: '700',
    marginBottom: 8
  },
  reloadVoicesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  reloadVoicesText: {
    fontWeight: '600'
  },
  voiceCardsList: {
    gap: 10
  },
  voiceCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10
  },
  voiceCardInfo: {
    gap: 4
  },
  voiceCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  voiceCardDisplayName: {
    fontWeight: '700'
  },
  voiceBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  voiceBadgeText: {
    fontWeight: '700'
  },
  voiceCardDescription: {
    lineHeight: 16
  },
  voiceCardActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  voiceSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10
  },
  voiceSelectBtnText: {
    fontWeight: '700'
  },
  voiceTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10
  },
  voiceTestBtnText: {
    fontWeight: '700'
  },
  noVoicesBox: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  noVoicesText: {
    textAlign: 'center',
    lineHeight: 18
  }
});
