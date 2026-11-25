import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AccessibilitySettings, ColorBlindnessType } from '../types';
import { getThemeColors, ThemeColors } from '../theme/tokens';
import { TTSService } from '../services/audio/TTSService';

interface AccessibilityContextData {
  settings: AccessibilitySettings;
  colors: ThemeColors;
  scaledFontSize: (baseSize: number) => number;
  setFontSizeScale: (scale: number) => void;
  setColorBlindness: (type: ColorBlindnessType) => void;
  toggleHaptic: () => void;
  toggleLibras: () => void;
  toggleSpeakForMe: () => void;
  speakText: (
    text: string,
    options?: {
      language?: string;
      voice?: string;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onDone?: () => void;
    }
  ) => Promise<void>;
  stopSpeaking: () => Promise<void>;
}

const defaultSettings: AccessibilitySettings = {
  fontSizeScale: 1.0, // Padrão normal (100%)
  colorBlindness: 'none',
  hapticFeedbackEnabled: false,
  librasEnabled: false,
  speakForMeEnabled: false
};

const AccessibilityContext = createContext<AccessibilityContextData | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  const colors = getThemeColors(settings.colorBlindness);

  const scaledFontSize = (baseSize: number): number => {
    return Math.round(baseSize * settings.fontSizeScale);
  };

  const setFontSizeScale = (scale: number) => {
    setSettings(prev => ({ ...prev, fontSizeScale: Math.max(1.0, Math.min(2.0, scale)) }));
  };

  const setColorBlindness = (type: ColorBlindnessType) => {
    setSettings(prev => ({ ...prev, colorBlindness: type }));
  };

  const toggleHaptic = () => {
    setSettings(prev => ({ ...prev, hapticFeedbackEnabled: !prev.hapticFeedbackEnabled }));
  };

  const toggleLibras = () => {
    setSettings(prev => ({ ...prev, librasEnabled: !prev.librasEnabled }));
  };

  const toggleSpeakForMe = () => {
    setSettings(prev => ({ ...prev, speakForMeEnabled: !prev.speakForMeEnabled }));
  };

  const speakText = async (
    text: string,
    options?: {
      language?: string;
      voice?: string;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onDone?: () => void;
    }
  ) => {
    await TTSService.speak(text, options);
  };

  const stopSpeaking = async () => {
    await TTSService.stop();
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        colors,
        scaledFontSize,
        setFontSizeScale,
        setColorBlindness,
        toggleHaptic,
        toggleLibras,
        toggleSpeakForMe,
        speakText,
        stopSpeaking
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export function useAccessibility(): AccessibilityContextData {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility deve ser utilizado dentro de um AccessibilityProvider');
  }
  return context;
}

