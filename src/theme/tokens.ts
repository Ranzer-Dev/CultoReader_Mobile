import { ColorBlindnessType } from '../types';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  card: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  highlight: string;
  thumbZoneBackground: string;
}

export const normalTheme: ThemeColors = {
  background: '#0F172A', // Slate 900
  surface: '#1E293B',    // Slate 800
  surfaceElevated: '#334155', // Slate 700
  card: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#6366F1',    // Indigo 500
  primaryText: '#FFFFFF',
  secondary: '#38BDF8',  // Sky 400
  accent: '#F59E0B',     // Amber 500
  success: '#10B981',    // Emerald 500
  warning: '#F59E0B',
  danger: '#EF4444',
  highlight: '#FBBF24',
  thumbZoneBackground: '#131D31'
};

export const protanopiaTheme: ThemeColors = {
  ...normalTheme,
  primary: '#2563EB',    // Azul forte
  accent: '#FACC15',     // Amarelo dourado
  success: '#38BDF8',    // Ciano claro
  danger: '#F97316',     // Laranja no lugar de vermelho
  highlight: '#FEF08A'
};

export const deuteranopiaTheme: ThemeColors = {
  ...normalTheme,
  primary: '#3B82F6',    // Azul puro
  secondary: '#F59E0B',  // Âmbar
  success: '#60A5FA',    // Azul céu
  danger: '#E11D48',     // Carmesim distinguível
  highlight: '#FDE047'
};

export const tritanopiaTheme: ThemeColors = {
  ...normalTheme,
  primary: '#DC2626',    // Vermelho claro
  secondary: '#059669',  // Verde esmeralda
  accent: '#E11D48',
  success: '#10B981',
  danger: '#B91C1C',
  highlight: '#FCA5A5'
};

export const highContrastTheme: ThemeColors = {
  background: '#000000',
  surface: '#121212',
  surfaceElevated: '#242424',
  card: '#181818',
  border: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#E0E0E0',
  textMuted: '#B0B0B0',
  primary: '#FFFF00',    // Amarelo Puro
  primaryText: '#000000',
  secondary: '#00FFFF',  // Ciano Puro
  accent: '#FF00FF',     // Magenta Puro
  success: '#00FF00',    // Verde Puro
  warning: '#FFFF00',
  danger: '#FF3333',
  highlight: '#FFFF00',
  thumbZoneBackground: '#000000'
};

export function getThemeColors(type: ColorBlindnessType): ThemeColors {
  switch (type) {
    case 'protanopia':
      return protanopiaTheme;
    case 'deuteranopia':
      return deuteranopiaTheme;
    case 'tritanopia':
      return tritanopiaTheme;
    case 'high_contrast':
      return highContrastTheme;
    case 'none':
    default:
      return normalTheme;
  }
}

