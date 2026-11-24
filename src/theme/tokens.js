"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getThemeColors = exports.highContrastTheme = exports.tritanopiaTheme = exports.deuteranopiaTheme = exports.protanopiaTheme = exports.normalTheme = void 0;
exports.normalTheme = {
    background: '#0F172A', // Slate 900
    surface: '#1E293B', // Slate 800
    surfaceElevated: '#334155', // Slate 700
    card: '#1E293B',
    border: '#334155',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    primary: '#6366F1', // Indigo 500
    primaryText: '#FFFFFF',
    secondary: '#38BDF8', // Sky 400
    accent: '#F59E0B', // Amber 500
    success: '#10B981', // Emerald 500
    warning: '#F59E0B',
    danger: '#EF4444',
    highlight: '#FBBF24',
    thumbZoneBackground: '#131D31'
};
exports.protanopiaTheme = {
    ...exports.normalTheme,
    primary: '#2563EB', // Azul forte
    accent: '#FACC15', // Amarelo dourado
    success: '#38BDF8', // Ciano claro
    danger: '#F97316', // Laranja no lugar de vermelho
    highlight: '#FEF08A'
};
exports.deuteranopiaTheme = {
    ...exports.normalTheme,
    primary: '#3B82F6', // Azul puro
    secondary: '#F59E0B', // Âmbar
    success: '#60A5FA', // Azul céu
    danger: '#E11D48', // Carmesim distinguível
    highlight: '#FDE047'
};
exports.tritanopiaTheme = {
    ...exports.normalTheme,
    primary: '#DC2626', // Vermelho claro
    secondary: '#059669', // Verde esmeralda
    accent: '#E11D48',
    success: '#10B981',
    danger: '#B91C1C',
    highlight: '#FCA5A5'
};
exports.highContrastTheme = {
    background: '#000000',
    surface: '#121212',
    surfaceElevated: '#242424',
    card: '#181818',
    border: '#FFFFFF',
    text: '#FFFFFF',
    textSecondary: '#E0E0E0',
    textMuted: '#B0B0B0',
    primary: '#FFFF00', // Amarelo Puro
    primaryText: '#000000',
    secondary: '#00FFFF', // Ciano Puro
    accent: '#FF00FF', // Magenta Puro
    success: '#00FF00', // Verde Puro
    warning: '#FFFF00',
    danger: '#FF3333',
    highlight: '#FFFF00',
    thumbZoneBackground: '#000000'
};
function getThemeColors(type) {
    switch (type) {
        case 'protanopia':
            return exports.protanopiaTheme;
        case 'deuteranopia':
            return exports.deuteranopiaTheme;
        case 'tritanopia':
            return exports.tritanopiaTheme;
        case 'high_contrast':
            return exports.highContrastTheme;
        case 'none':
        default:
            return exports.normalTheme;
    }
}
exports.getThemeColors = getThemeColors;
