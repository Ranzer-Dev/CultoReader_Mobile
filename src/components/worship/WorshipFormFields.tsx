import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { BookOpen, User, Calendar, Tag, FileText, Mic, MicOff, Save } from 'lucide-react-native';
import { ThemeColors } from '../../theme/tokens';

interface WorshipFormFieldsProps {
  isEditing: boolean;
  title: string;
  onChangeTitle: (text: string) => void;
  preacher: string;
  onChangePreacher: (text: string) => void;
  serviceDate: string;
  onChangeServiceDate: (text: string) => void;
  tags: string;
  onChangeTags: (text: string) => void;
  summary: string;
  onChangeSummary: (text: string) => void;
  fullTranscript: string;
  onChangeFullTranscript: (text: string) => void;
  isDictating: boolean;
  onToggleDictation: () => void;
  saving: boolean;
  onSubmit: () => void;
  colors: ThemeColors;
  scaledFontSize: (size: number) => number;
}

export function WorshipFormFields({
  isEditing,
  title,
  onChangeTitle,
  preacher,
  onChangePreacher,
  serviceDate,
  onChangeServiceDate,
  tags,
  onChangeTags,
  summary,
  onChangeSummary,
  fullTranscript,
  onChangeFullTranscript,
  isDictating,
  onToggleDictation,
  saving,
  onSubmit,
  colors,
  scaledFontSize
}: WorshipFormFieldsProps) {
  return (
    <View style={styles.container}>
      {/* Título / Tema */}
      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <BookOpen size={scaledFontSize(16)} color={colors.primary} />
          <Text style={[styles.label, { color: colors.text, fontSize: scaledFontSize(14) }]}>
            Tema / Título do Culto *
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, fontSize: scaledFontSize(15) }
          ]}
          placeholder="Ex: O Poder da Oração"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={onChangeTitle}
        />
      </View>

      {/* Pregador */}
      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <User size={scaledFontSize(16)} color={colors.accent} />
          <Text style={[styles.label, { color: colors.text, fontSize: scaledFontSize(14) }]}>
            Pastor / Preletor *
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, fontSize: scaledFontSize(15) }
          ]}
          placeholder="Ex: Pr. João Silva"
          placeholderTextColor={colors.textMuted}
          value={preacher}
          onChangeText={onChangePreacher}
        />
      </View>

      {/* Data */}
      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <Calendar size={scaledFontSize(16)} color={colors.secondary} />
          <Text style={[styles.label, { color: colors.text, fontSize: scaledFontSize(14) }]}>
            Data do Culto (AAAA-MM-DD) *
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, fontSize: scaledFontSize(15) }
          ]}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={colors.textMuted}
          value={serviceDate}
          onChangeText={onChangeServiceDate}
        />
      </View>

      {/* Tags */}
      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <Tag size={scaledFontSize(16)} color={colors.highlight} />
          <Text style={[styles.label, { color: colors.text, fontSize: scaledFontSize(14) }]}>
            Tags / Palavras-chave (separadas por vírgula)
          </Text>
        </View>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, fontSize: scaledFontSize(15) }
          ]}
          placeholder="Ex: Fé, Oração, Esperança"
          placeholderTextColor={colors.textMuted}
          value={tags}
          onChangeText={onChangeTags}
        />
      </View>

      {/* Resumo */}
      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <FileText size={scaledFontSize(16)} color={colors.primary} />
          <Text style={[styles.label, { color: colors.text, fontSize: scaledFontSize(14) }]}>
            Resumo da Mensagem
          </Text>
        </View>
        <TextInput
          style={[
            styles.textArea,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, fontSize: scaledFontSize(14) }
          ]}
          placeholder="Breve síntese dos principais ensinamentos ministrados..."
          placeholderTextColor={colors.textMuted}
          value={summary}
          onChangeText={onChangeSummary}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Transcrição Completa com Botão para Falar / Ditar */}
      <View style={styles.inputGroup}>
        <View style={styles.labelRowBetween}>
          <View style={styles.labelRow}>
            <FileText size={scaledFontSize(16)} color={colors.secondary} />
            <Text style={[styles.label, { color: colors.text, fontSize: scaledFontSize(14) }]}>
              Transcrição / Conteúdo Completo
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.dictateButton,
              {
                backgroundColor: isDictating ? colors.danger : colors.surfaceElevated,
                borderColor: isDictating ? colors.danger : colors.primary
              }
            ]}
            onPress={onToggleDictation}
            accessibilityLabel={isDictating ? 'Parar ditado por voz' : 'Falar transcrição por voz'}
            accessibilityRole="button"
          >
            {isDictating ? (
              <MicOff size={scaledFontSize(14)} color="#FFFFFF" />
            ) : (
              <Mic size={scaledFontSize(14)} color={colors.primary} />
            )}
            <Text
              style={[
                styles.dictateButtonText,
                { color: isDictating ? '#FFFFFF' : colors.primary, fontSize: scaledFontSize(12) }
              ]}
            >
              {isDictating ? 'Ouvindo... Parar' : 'Falar por Voz'}
            </Text>
          </TouchableOpacity>
        </View>

        {isDictating ? (
          <View style={[styles.dictateBanner, { backgroundColor: colors.danger + '18', borderColor: colors.danger }]}>
            <Text style={[styles.dictateBannerText, { color: colors.danger, fontSize: scaledFontSize(12) }]}>
              ● Microfone ligado: fale agora que o texto será inserido abaixo automaticamente.
            </Text>
          </View>
        ) : null}

        <TextInput
          style={[
            styles.textAreaLarge,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, fontSize: scaledFontSize(14) }
          ]}
          placeholder="Texto integral ou anotações detalhadas da palavra (digite ou use o botão 'Falar por Voz')..."
          placeholderTextColor={colors.textMuted}
          value={fullTranscript}
          onChangeText={onChangeFullTranscript}
          multiline
          numberOfLines={6}
        />
      </View>

      {/* Botão de Salvar */}
      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: colors.primary }, saving && styles.submitButtonDisabled]}
        onPress={onSubmit}
        disabled={saving}
        accessibilityLabel="Salvar registro de culto"
        accessibilityRole="button"
      >
        {saving ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <>
            <Save size={scaledFontSize(18)} color={colors.primaryText} />
            <Text style={[styles.submitButtonText, { color: colors.primaryText, fontSize: scaledFontSize(16) }]}>
              {isEditing ? 'Salvar Alterações' : 'Cadastrar no SQLite'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16
  },
  inputGroup: {
    gap: 8
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  labelRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontWeight: '600'
  },
  dictateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1
  },
  dictateButtonText: {
    fontWeight: '600'
  },
  dictateBanner: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1
  },
  dictateBannerText: {
    fontWeight: '600'
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
    minHeight: 80
  },
  textAreaLarge: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
    minHeight: 140
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 10
  },
  submitButtonDisabled: {
    opacity: 0.6
  },
  submitButtonText: {
    fontWeight: '700'
  }
});
