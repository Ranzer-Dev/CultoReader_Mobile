import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Volume2,
  Clock,
  User
} from 'lucide-react-native';
import { useAccessibility } from '../../src/context/AccessibilityContext';
import { WorshipRepository } from '../../src/database/repositories/WorshipRepository';
import { WorshipService } from '../../src/types';
import { LanguageSelectorButton } from '../../src/components/LanguageSelectorButton';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, scaledFontSize, speakText } = useAccessibility();

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

      // Carrega cultos do dia selecionado
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

  // Montar grade de dias do mês atual
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

  const monthName = currentMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.screenTitle, { color: colors.text, fontSize: scaledFontSize(22) }]}>
            Calendário de Cultos
          </Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary, fontSize: scaledFontSize(13) }]}>
            Navegue pelas ministrações por data
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
            accessibilityLabel="Mês anterior"
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
            accessibilityLabel="Próximo mês"
            accessibilityRole="button"
          >
            <ChevronRight size={scaledFontSize(18)} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Grade de Dias da Semana */}
        <View style={styles.weekRow}>
          {weekDays.map(w => (
            <Text
              key={w}
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
              Cultos em {selectedDate} ({cultosOfDay.length})
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : cultosOfDay.length > 0 ? (
            cultosOfDay.map(c => (
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
                    onPress={() => speakText(`${c.title}. Pregador: ${c.preacher}. ${c.summary || c.full_transcript}`)}
                    accessibilityLabel="Ouvir resumo"
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
                Nenhum culto registrado nesta data. Selecione um dia destacado com marcador.
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
    paddingVertical: 6
  },
  weekDayText: {
    fontWeight: '600',
    width: '14%',
    textAlign: 'center'
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  dayCell: {
    width: '12.8%',
    aspectRatio: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1
  },
  dayCellEmpty: {
    width: '12.8%',
    aspectRatio: 1
  },
  dayText: {
    fontWeight: '600'
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2
  },
  selectedDateSection: {
    marginTop: 8,
    gap: 12
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
    gap: 8
  },
  cultoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cultoTitle: {
    fontWeight: '700',
    flex: 1
  },
  audioBtn: {
    padding: 6,
    borderRadius: 8,
    marginLeft: 8
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
    lineHeight: 18
  },
  emptyDayBox: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  emptyDayText: {
    textAlign: 'center'
  }
});

