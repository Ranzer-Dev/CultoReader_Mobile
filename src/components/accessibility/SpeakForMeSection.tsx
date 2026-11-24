import React from 'react';
import { View, Text, Switch, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { MessageSquare, Volume2 } from 'lucide-react-native';
import { ThemeColors } from '../../theme/tokens';

interface SpeakForMeSectionProps {
  speakForMeEnabled: boolean;
  onToggleSpeakForMe: () => void;
  customSpeakText: string;
  onChangeCustomSpeakText: (text: string) => void;
  onSpeak: (text: string) => void;
  colors: ThemeColors;
  scaledFontSize: (size: number) => number;
}

const QUICK_SPEECH_CARDS = [
  'Amém! Concordo com a palavra.',
  'Poderia repetir o versículo lido?',
  'Preciso de uma oração após o culto.',
  'Onde fica a secretaria da igreja?'
];

export function SpeakForMeSection({
  speakForMeEnabled,
  onToggleSpeakForMe,
  customSpeakText,
  onChangeCustomSpeakText,
  onSpeak,
  colors,
  scaledFontSize
}: SpeakForMeSectionProps) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <MessageSquare size={scaledFontSize(20)} color={colors.highlight} />
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaledFontSize(16) }]}>
          Mecanismos para Mudos (Falar por Mim)
        </Text>
      </View>

      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.toggleTitle, { color: colors.text, fontSize: scaledFontSize(14) }]}>
            Cartões de Fala Rápida Assistida
          </Text>
          <Text style={[styles.toggleDesc, { color: colors.textMuted, fontSize: scaledFontSize(12) }]}>
            Permite comunicar-se na congregação usando sintetizador de voz (TTS).
          </Text>
        </View>
        <Switch
          value={speakForMeEnabled}
          onValueChange={onToggleSpeakForMe}
          trackColor={{ false: colors.surfaceElevated, true: colors.primary }}
          accessibilityLabel="Alternar cartões de fala rápida"
        />
      </View>

      {speakForMeEnabled ? (
        <View style={styles.speakForMeSection}>
          <Text style={[styles.quickSpeechHeader, { color: colors.textSecondary, fontSize: scaledFontSize(12) }]}>
            TOQUE PARA O APLICATIVO FALAR POR VOCÊ:
          </Text>
          {QUICK_SPEECH_CARDS.map((phrase, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.phraseCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={() => onSpeak(phrase)}
              accessibilityRole="button"
              accessibilityLabel={`Falar frase: ${phrase}`}
            >
              <Volume2 size={scaledFontSize(16)} color={colors.accent} />
              <Text style={[styles.phraseCardText, { color: colors.text, fontSize: scaledFontSize(13) }]}>
                {phrase}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Digitar frase customizada para falar */}
          <View style={styles.customSpeakRow}>
            <TextInput
              style={[
                styles.customSpeakInput,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  color: colors.text,
                  fontSize: scaledFontSize(13)
                }
              ]}
              placeholder="Digite o que deseja falar..."
              placeholderTextColor={colors.textMuted}
              value={customSpeakText}
              onChangeText={onChangeCustomSpeakText}
            />
            <TouchableOpacity
              style={[
                styles.customSpeakButton,
                { backgroundColor: colors.primary },
                !customSpeakText.trim() && { opacity: 0.5 }
              ]}
              disabled={!customSpeakText.trim()}
              onPress={() => {
                onSpeak(customSpeakText);
                onChangeCustomSpeakText('');
              }}
              accessibilityRole="button"
              accessibilityLabel="Falar texto digitado"
            >
              <Volume2 size={scaledFontSize(18)} color={colors.primaryText} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  toggleTitle: {
    fontWeight: '600'
  },
  toggleDesc: {
    lineHeight: 16,
    marginTop: 2
  },
  speakForMeSection: {
    gap: 8,
    marginTop: 6
  },
  quickSpeechHeader: {
    fontWeight: '700',
    letterSpacing: 0.5
  },
  phraseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10
  },
  phraseCardText: {
    flex: 1,
    fontWeight: '500'
  },
  customSpeakRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  customSpeakInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  customSpeakButton: {
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
