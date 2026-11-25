import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibility } from '../../src/context/AccessibilityContext';
import { useLanguage } from '../../src/i18n';
import { TTSService, HumanFriendlyVoice } from '../../src/services/audio/TTSService';
import { LanguageSelectorButton } from '../../src/components/LanguageSelectorButton';
import { AppLanguageSection } from '../../src/components/accessibility/AppLanguageSection';
import { FontSizeSection } from '../../src/components/accessibility/FontSizeSection';
import { ColorBlindnessSection } from '../../src/components/accessibility/ColorBlindnessSection';
import { SensoryAssistSection } from '../../src/components/accessibility/SensoryAssistSection';
import { VoiceSynthesisSection } from '../../src/components/accessibility/VoiceSynthesisSection';
import { SpeakForMeSection } from '../../src/components/accessibility/SpeakForMeSection';

export default function AccessibilityScreen() {
  const insets = useSafeAreaInsets();
  const { t, language, languageInfo, languages, setLanguage } = useLanguage();
  const {
    settings,
    colors,
    scaledFontSize,
    setFontSizeScale,
    setColorBlindness,
    toggleLibras,
    toggleSpeakForMe,
    speakText
  } = useAccessibility();

  const [customSpeakText, setCustomSpeakText] = useState('');
  const [availableVoices, setAvailableVoices] = useState<HumanFriendlyVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const loadVoices = useCallback(async () => {
    try {
      const targetLocale = languageInfo.speechLocale;
      const voices = await TTSService.getAvailableVoicesForLanguage(targetLocale);
      setAvailableVoices(voices);
      const best = await TTSService.getBestVoiceForLanguageAsync(targetLocale);
      setSelectedVoiceId(best || '');
    } catch {}
  }, [languageInfo.speechLocale]);

  useEffect(() => {
    loadVoices();
  }, [loadVoices]);

  const handleSelectVoice = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    TTSService.setUserPreferredVoice(voiceId, languageInfo.speechLocale);
  };

  const handleTestSpecificVoice = async (voiceId: string) => {
    setPlayingVoiceId(voiceId);
    handleSelectVoice(voiceId);
    await speakText(t.accessibility.ttsDemoPhrase, {
      voice: voiceId,
      language: languageInfo.speechLocale
    });
    setPlayingVoiceId(null);
  };

  const handleOpenTtsSettings = async () => {
    if (Platform.OS === 'android') {
      try {
        await Linking.sendIntent('android.settings.TTS_SETTINGS');
      } catch {
        try {
          await Linking.sendIntent('com.android.settings.TTS_SETTINGS');
        } catch {
          await Linking.openSettings();
        }
      }
    } else {
      await Linking.openSettings();
    }
  };

  const handleOpenGoogleTtsStore = async () => {
    try {
      await Linking.openURL('market://details?id=com.google.android.tts');
    } catch {
      await Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.tts');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text style={[styles.screenTitle, { color: colors.text, fontSize: scaledFontSize(22) }]}>
            {t.accessibility.title}
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary, fontSize: scaledFontSize(13) }]}>
            {t.accessibility.subtitle}
          </Text>
        </View>
        <LanguageSelectorButton />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 0. Idioma do Aplicativo */}
        <AppLanguageSection
          currentLanguage={language}
          languages={languages}
          onSelectLanguage={setLanguage}
          title={t.accessibility.language}
          subtitle={t.accessibility.selectLanguage}
          colors={colors}
          scaledFontSize={scaledFontSize}
        />

        {/* 1. Tamanho da Fonte */}
        <FontSizeSection
          currentScale={settings.fontSizeScale}
          onSelectScale={setFontSizeScale}
          colors={colors}
          scaledFontSize={scaledFontSize}
        />

        {/* 2. Daltonismo e Alto Contraste */}
        <ColorBlindnessSection
          currentColorBlindness={settings.colorBlindness}
          onSelectColorBlindness={setColorBlindness}
          colors={colors}
          scaledFontSize={scaledFontSize}
        />

        {/* 3. Recursos para Surdos (Libras) */}
        <SensoryAssistSection
          librasEnabled={settings.librasEnabled}
          onToggleLibras={toggleLibras}
          colors={colors}
          scaledFontSize={scaledFontSize}
        />

        {/* 4. Voz de Leitura e Síntese Natural (TTS) */}
        <VoiceSynthesisSection
          availableVoices={availableVoices}
          selectedVoiceId={selectedVoiceId}
          playingVoiceId={playingVoiceId}
          onSelectVoice={handleSelectVoice}
          onTestVoice={handleTestSpecificVoice}
          onReloadVoices={loadVoices}
          onOpenTtsSettings={handleOpenTtsSettings}
          onOpenGoogleTtsStore={handleOpenGoogleTtsStore}
          colors={colors}
          scaledFontSize={scaledFontSize}
        />

        {/* 5. Falar por Mim (Comunicação AAC) */}
        <SpeakForMeSection
          speakForMeEnabled={settings.speakForMeEnabled}
          onToggleSpeakForMe={toggleSpeakForMe}
          customSpeakText={customSpeakText}
          onChangeCustomSpeakText={setCustomSpeakText}
          onSpeak={(text) => speakText(text, { language: languageInfo.speechLocale })}
          colors={colors}
          scaledFontSize={scaledFontSize}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitles: {
    flex: 1,
    marginRight: 8
  },
  screenTitle: {
    fontWeight: '800'
  },
  screenSubtitle: {
    fontWeight: '500',
    marginTop: 2
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40
  }
});
