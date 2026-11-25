import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Volume2,
  User
} from 'lucide-react-native';
import { useAccessibility } from '../../src/context/AccessibilityContext';
import { useLanguage } from '../../src/i18n';
import { WorshipRepository } from '../../src/database/repositories/WorshipRepository';
import { WorshipService } from '../../src/types';
import { LanguageSelectorButton } from '../../src/components/LanguageSelectorButton';
import { useTranslatedWorships } from '../../src/services/translation/WorshipContentTranslator';
import { TTSService } from '../../src/services/audio/TTSService';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { colors, scaledFontSize, speakText } = useAccessibility();
  const { t, language, languageInfo } = useLanguage();

  const [currentMonthDate, setCurrentMonthDate] = useState(new Date('2026-11-01'));
  const [markedDates, setMarkedDates] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-01');
  const [cultosOfDay, setCultosOfDay] = useState<WorshipService[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const dates = await WorshipRepository.listAllCalendarDates();
      const map: Record<string, number> = {};
      dates.forEach(d => {
        map[d.service_date] = d.count;
      });
      setMarkedDates(map);

      if (selectedDate) {
        const result = await WorshipRepository.findPaginated({
          page: 1,
          pageSize: 20,
          date: selectedDate
        });
        setCultosOfDay(result.data);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      loadCalendarData();
    }, [loadCalendarData])
  );

  useEffect(() => {
    TTSService.stop().catch(() => {});
  }, [language]);

  const { items: localizedCultosOfDay } = useTranslatedWorships(cultosOfDay, language);

  const handleSelectDay = async (dateStr: string) => {
    setSelectedDate(dateStr);
    const result = await WorshipRepository.findPaginated({
      page: 1,
      pageSize: 20,
      date: dateStr
    });
    setCultosOfDay(result.data);
  };

  const handlePrevMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysGrid.push(d);
  }

  let monthName = '';
  try {
    monthName = currentMonthDate.toLocaleDateString(t.calendar.dateLocale, { month: 'long', year: 'numeric' });
  } catch {
    monthName = currentMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }
  const weekDays = t.calendar.weekDays;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.screenTitle, { color: colors.text, fontSize: scaledFontSize(22) }]}>
            {t.calendar.title}
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary, fontSize: scaledFontSize(13) }]}>
            {t.calendar.subtitle}
          </Text>
        </View>
        <LanguageSelectorButton />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Navegador de Mês */}
        <View style={[styles.monthSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.navMonthBtn, { backgroundColor: colors.surfaceElevated }]}
            onPress={handlePrevMonth}
            accessibilityLabel={t.common.previous}
            accessibilityRole="button"
          >
            <ChevronLeft size={scaledFontSize(18)} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.monthLabel, { color: colors.text, fontSize: scaledFontSize(16) }]}>
            {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
          </Text>

          <TouchableOpacity
            style={[styles.navMonthBtn, { backgroundColor: colors.surfaceElevated }]}
            onPress={handleNextMonth}
            accessibilityLabel={t.common.next}
            accessibilityRole="button"
          >
            <ChevronRight size={scaledFontSize(18)} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Grade de Dias da Semana */}
        <View style={styles.weekRow}>
          {weekDays.map((w, idx) => (
            <Text
              key={`${w}-${idx}`}
              style={[styles.weekDayText, { color: colors.textMuted, fontSize: scaledFontSize(12) }]}
            >
              {w}
            </Text>
          ))}
        </View>

        {/* Grid de Dias */}
        <View style={styles.daysGrid}>
          {daysGrid.map((day, idx) => {
            if (day === null) {
              return <View key={`empty-${idx}`} style={styles.dayCellEmpty} />;
            }

            const dayPadded = String(day).padStart(2, '0');
            const monthPadded = String(month + 1).padStart(2, '0');
            const dateStr = `${year}-${monthPadded}-${dayPadded}`;

            const hasCulto = Boolean(markedDates[dateStr]);
            const isSelected = selectedDate === dateStr;

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.dayCell,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  hasCulto && { borderColor: colors.accent, borderWidth: 1.5 },
                  isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => handleSelectDay(dateStr)}
              >
                <Text
                  style={[
                    styles.dayText,
                    {
                      color: isSelected ? colors.primaryText : colors.text,
                      fontSize: scaledFontSize(14),
                      fontWeight: hasCulto ? '700' : '500'
                    }
                  ]}
                >
                  {day}
                </Text>
                {hasCulto ? (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: isSelected ? colors.primaryText : colors.accent }
                    ]}
                  />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Lista de Cultos da Data Selecionada */}
        <View style={styles.selectedDateSection}>
          <View style={styles.selectedDateHeader}>
            <CalendarIcon size={scaledFontSize(16)} color={colors.accent} />
            <Text style={[styles.selectedDateTitle, { color: colors.text, fontSize: scaledFontSize(16) }]}>
              {t.calendar.servicesOnDate
                .replace('{date}', selectedDate)
                .replace('{count}', String(localizedCultosOfDay.length))}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : localizedCultosOfDay.length > 0 ? (
            localizedCultosOfDay.map(c => (
              <View
                key={c.id}
                style={[styles.cultoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.cultoCardHeader}>
                  <Text style={[styles.cultoTitle, { color: colors.text, fontSize: scaledFontSize(16) }]}>
                    {c.title}
                  </Text>
                  <TouchableOpacity
                    style={[styles.audioBtn, { backgroundColor: colors.surfaceElevated }]}
                    onPress={() => {
                      const preacherLabel = t.worship.preacher.split('/')[0].trim();
                      speakText(
                        `${c.title}. ${preacherLabel}: ${c.preacher}. ${c.summary || c.full_transcript}`,
                        { language: languageInfo.speechLocale }
                      );
                    }}
                    accessibilityLabel={t.worship.listenSummary}
                    accessibilityRole="button"
                  >
                    <Volume2 size={scaledFontSize(16)} color={colors.secondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.cultoMeta}>
                  <User size={scaledFontSize(14)} color={colors.textSecondary} />
                  <Text style={[styles.cultoPreacher, { color: colors.textSecondary, fontSize: scaledFontSize(13) }]}>
                    {c.preacher}
                  </Text>
                </View>

                {c.summary ? (
                  <Text style={[styles.cultoSummary, { color: colors.textSecondary, fontSize: scaledFontSize(13) }]}>
                    {c.summary}
                  </Text>
                ) : null}
              </View>
            ))
          ) : (
            <View style={[styles.emptyDayBox, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.emptyDayText, { color: colors.textMuted, fontSize: scaledFontSize(13) }]}>
                {t.calendar.noServicesOnDate}
              </Text>
            </View>
          )}
        </View>
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
    paddingVertical: 12
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
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1
  },
  navMonthBtn: {
    padding: 8,
    borderRadius: 10
  },
  monthLabel: {
    fontWeight: '700'
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4
  },
  weekDayText: {
    width: '14.2%',
    textAlign: 'center',
    fontWeight: '700'
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start'
  },
  dayCellEmpty: {
    width: '12.6%',
    aspectRatio: 1
  },
  dayCell: {
    width: '12.6%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2
  },
  dayText: {},
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3
  },
  selectedDateSection: {
    gap: 10,
    marginTop: 6
  },
  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  selectedDateTitle: {
    fontWeight: '700'
  },
  cultoCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6
  },
  cultoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8
  },
  cultoTitle: {
    fontWeight: '700',
    flex: 1
  },
  audioBtn: {
    padding: 8,
    borderRadius: 10
  },
  cultoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  cultoPreacher: {
    fontWeight: '500'
  },
  cultoSummary: {
    lineHeight: 19
  },
  emptyDayBox: {
    padding: 20,
    borderRadius: 14,
    alignItems: 'center'
  },
  emptyDayText: {
    textAlign: 'center',
    lineHeight: 18
  }
});
