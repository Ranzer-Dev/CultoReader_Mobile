import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useAccessibility } from '../../src/context/AccessibilityContext';
import { useLanguage } from '../../src/i18n';
import { useWorshipForm } from '../../src/hooks/useWorshipForm';
import { useVoiceDictation } from '../../src/hooks/useVoiceDictation';
import { WorshipFormTopBar } from '../../src/components/worship/WorshipFormTopBar';
import { WorshipFormFields } from '../../src/components/worship/WorshipFormFields';

export default function WorshipFormScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { colors, scaledFontSize } = useAccessibility();
  const { t } = useLanguage();

  // 1. Hook de dados do formulário
  const form = useWorshipForm({
    id: params.id,
    onSuccess: () => router.back()
  });

  // 2. Hook de ditado por voz (desacoplado do componente nativo)
  const dictation = useVoiceDictation({
    onTextAppend: form.appendTranscriptChunk
  });

  if (form.loading) {
    return (
      <View style={[styles.centerLoading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingLabel, { color: colors.textSecondary }]}>{t.common.loading}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      {/* Barra de Topo */}
      <WorshipFormTopBar
        isEditing={form.isEditing}
        onBack={() => router.back()}
        colors={colors}
        scaledFontSize={scaledFontSize}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <WorshipFormFields
          isEditing={form.isEditing}
          title={form.title}
          onChangeTitle={form.setTitle}
          preacher={form.preacher}
          onChangePreacher={form.setPreacher}
          serviceDate={form.serviceDate}
          onChangeServiceDate={form.setServiceDate}
          tags={form.tags}
          onChangeTags={form.setTags}
          summary={form.summary}
          onChangeSummary={form.setSummary}
          fullTranscript={form.fullTranscript}
          onChangeFullTranscript={form.setFullTranscript}
          isDictating={dictation.isDictating}
          onToggleDictation={dictation.toggleDictation}
          saving={form.saving}
          onSubmit={form.handleSave}
          colors={colors}
          scaledFontSize={scaledFontSize}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },
  loadingLabel: {
    fontWeight: '500'
  }
});
