import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback
} from 'react-native';
import { Globe, Check, X } from 'lucide-react-native';
import { useLanguage } from '../i18n';
import { useAccessibility } from '../context/AccessibilityContext';
import { SupportedLanguage } from '../i18n/types';

interface LanguageSelectorButtonProps {
  showLabel?: boolean;
}

export const LanguageSelectorButton: React.FC<LanguageSelectorButtonProps> = ({ showLabel = true }) => {
  const { language, languageInfo, languages, setLanguage, t } = useLanguage();
  const { colors, scaledFontSize } = useAccessibility();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelectLanguage = async (code: SupportedLanguage) => {
    await setLanguage(code);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border
          }
        ]}
        onPress={() => setModalVisible(true)}
        accessibilityLabel={`Idioma do aplicativo: ${languageInfo.name}. Toque para alterar.`}
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        <Text style={{ fontSize: scaledFontSize(16) }}>{languageInfo.flag}</Text>
        {showLabel && (
          <Text
            style={[
              styles.buttonText,
              { color: colors.text, fontSize: scaledFontSize(12) }
            ]}
          >
            {languageInfo.name.substring(0, 3).toUpperCase()}
          </Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: colors.surface, borderColor: colors.border }
                ]}
              >
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Globe size={scaledFontSize(18)} color={colors.primary} />
                    <Text
                      style={[
                        styles.modalTitle,
                        { color: colors.text, fontSize: scaledFontSize(16) }
                      ]}
                    >
                      {t.accessibility.language}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={[styles.closeButton, { backgroundColor: colors.surfaceElevated }]}
                    accessibilityLabel="Fechar seletor de idioma"
                  >
                    <X size={scaledFontSize(18)} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 350 }}>
                  {languages.map((l) => {
                    const isSelected = language === l.code;
                    return (
                      <TouchableOpacity
                        key={l.code}
                        style={[
                          styles.langItem,
                          {
                            backgroundColor: isSelected
                              ? colors.primary + '18'
                              : 'transparent',
                            borderColor: isSelected ? colors.primary : colors.border
                          }
                        ]}
                        onPress={() => handleSelectLanguage(l.code as SupportedLanguage)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <Text style={{ fontSize: scaledFontSize(22) }}>{l.flag}</Text>
                          <View>
                            <Text
                              style={[
                                styles.langName,
                                {
                                  color: isSelected ? colors.primary : colors.text,
                                  fontSize: scaledFontSize(14),
                                  fontWeight: isSelected ? '700' : '500'
                                }
                              ]}
                            >
                              {l.name}
                            </Text>
                            <Text
                              style={{
                                color: colors.textMuted,
                                fontSize: scaledFontSize(11)
                              }}
                            >
                              {l.speechLocale}
                            </Text>
                          </View>
                        </View>
                        {isSelected && (
                          <Check size={scaledFontSize(18)} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4
  },
  buttonText: {
    fontWeight: '700'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontWeight: '700'
  },
  closeButton: {
    padding: 6,
    borderRadius: 10
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 4
  },
  langName: {}
});
