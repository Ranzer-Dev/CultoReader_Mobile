import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  User,
  Trash2,
  Edit,
  Volume2,
  BookOpen
} from 'lucide-react-native';
import { useAccessibility } from '../../src/context/AccessibilityContext';
import { useLanguage } from '../../src/i18n';
import { LanguageSelectorButton } from '../../src/components/LanguageSelectorButton';
import { WorshipRepository } from '../../src/database/repositories/WorshipRepository';
import { WorshipService, PaginatedResult } from '../../src/types';
import { PaginationControls } from '../../src/components/PaginationControls';
import { useTranslatedWorships } from '../../src/services/translation/WorshipContentTranslator';
import { TTSService } from '../../src/services/audio/TTSService';

const PAGE_SIZE = 4; // Exibe de 4 em 4 para navegação fluida e clara entre páginas
const EMPTY_WORSHIPS: WorshipService[] = [];

export default function CultosCrudScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, scaledFontSize, speakText } = useAccessibility();
  const { t, language, languageInfo } = useLanguage();

  const [paginatedData, setPaginatedData] = useState<PaginatedResult<WorshipService> | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const errorLabelRef = useRef(t.common.error);
  errorLabelRef.current = t.common.error;
  const loadRequestIdRef = useRef(0);

  const loadData = useCallback(async (page: number, search: string) => {
    const reqId = ++loadRequestIdRef.current;
    setLoading(true);
    try {
      const result = await WorshipRepository.findPaginated({
        page,
        pageSize: PAGE_SIZE,
        search
      });
      if (reqId === loadRequestIdRef.current) {
        setPaginatedData(result);
      }
    } catch (err: any) {
      if (reqId === loadRequestIdRef.current) {
        Alert.alert(errorLabelRef.current, err?.message || 'SQLite error');
      }
    } finally {
      if (reqId === loadRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(currentPage, searchQuery);
    }, [currentPage, searchQuery, loadData])
  );

  // Para qualquer leitura TTS anterior se o usuário trocar o idioma no topo
  useEffect(() => {
    TTSService.stop().catch(() => {});
  }, [language]);

  const { items: localizedWorships } = useTranslatedWorships(
    paginatedData?.data ?? EMPTY_WORSHIPS,
    language
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setCurrentPage(1); // Reinicia para a página 1 ao filtrar
  };

  const handleDelete = (item: WorshipService) => {
    Alert.alert(
      t.worship.confirmDeleteTitle,
      t.worship.confirmDeleteMessage.replace('{title}', item.title),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await WorshipRepository.delete(item.id);
              loadData(currentPage, searchQuery);
            } catch (err: any) {
              Alert.alert(t.common.error, err.message);
            }
          }
        }
      ]
    );
  };

  const handleEdit = (item: WorshipService) => {
    router.push({
      pathname: '/worship/form',
      params: { id: item.id.toString() }
    });
  };

  const handleCreateNew = () => {
    router.push('/worship/form');
  };

  const handleSpeakWorship = (item: WorshipService) => {
    const speechText = `${item.title}. ${t.worship.preacher}: ${item.preacher}. ${item.summary || item.full_transcript}`;
    speakText(speechText, { language: languageInfo.speechLocale });
  };

  const renderWorshipCard = ({ item }: { item: WorshipService }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.dateBadge}>
          <CalendarIcon size={scaledFontSize(12)} color={colors.accent} />
          <Text style={[styles.dateText, { color: colors.accent, fontSize: scaledFontSize(12) }]}>
            {item.service_date}
          </Text>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surfaceElevated }]}
            onPress={() => handleSpeakWorship(item)}
            accessibilityLabel={t.worship.listenSummary}
            accessibilityRole="button"
          >
            <Volume2 size={scaledFontSize(16)} color={colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surfaceElevated }]}
            onPress={() => handleEdit(item)}
            accessibilityLabel={t.worship.editWorship}
            accessibilityRole="button"
          >
            <Edit size={scaledFontSize(16)} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surfaceElevated }]}
            onPress={() => handleDelete(item)}
            accessibilityLabel={t.worship.deleteWorship}
            accessibilityRole="button"
          >
            <Trash2 size={scaledFontSize(16)} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text, fontSize: scaledFontSize(17) }]}>
        {item.title}
      </Text>

      <View style={styles.preacherRow}>
        <User size={scaledFontSize(14)} color={colors.textSecondary} />
        <Text style={[styles.preacherText, { color: colors.textSecondary, fontSize: scaledFontSize(13) }]}>
          {item.preacher}
        </Text>
      </View>

      {item.summary ? (
        <Text
          style={[styles.summaryText, { color: colors.textSecondary, fontSize: scaledFontSize(13) }]}
          numberOfLines={3}
        >
          {item.summary}
        </Text>
      ) : null}

      {item.tags ? (
        <View style={styles.tagsContainer}>
          {item.tags.split(',').map((tag, idx) => (
            <View
              key={idx}
              style={[styles.tagBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            >
              <Text style={[styles.tagText, { color: colors.textMuted, fontSize: scaledFontSize(11) }]}>
                #{tag.trim()}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.screenTitle, { color: colors.text, fontSize: scaledFontSize(22) }]}>
              {t.tabs.worships}
            </Text>
            <LanguageSelectorButton />
          </View>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary, fontSize: scaledFontSize(13) }]}>
            {t.tabs.worshipsSubtitle}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateNew}
          accessibilityLabel={t.worship.addWorship}
          accessibilityRole="button"
        >
          <Plus size={scaledFontSize(18)} color={colors.primaryText} />
          <Text style={[styles.addButtonText, { color: colors.primaryText, fontSize: scaledFontSize(14) }]}>
            {t.common.newButton}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Barra de Busca */}
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={scaledFontSize(18)} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text, fontSize: scaledFontSize(14) }]}
          placeholder={t.worship.searchPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Lista Paginada */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingLabel, { color: colors.textMuted, fontSize: scaledFontSize(14) }]}>
            {t.worship.loadingRecords}
          </Text>
        </View>
      ) : (
        <FlatList
          data={localizedWorships}
          keyExtractor={item => item.id.toString()}
          renderItem={renderWorshipCard}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            paginatedData ? (
              <PaginationControls
                currentPage={paginatedData.page}
                totalPages={paginatedData.totalPages}
                totalRecords={paginatedData.total}
                pageSize={paginatedData.pageSize}
                onPageChange={newPage => setCurrentPage(newPage)}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BookOpen size={scaledFontSize(40)} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary, fontSize: scaledFontSize(16) }]}>
                {t.worship.noWorships}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted, fontSize: scaledFontSize(13) }]}>
                {t.worship.emptySubtitle}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 4
  },
  addButtonText: {
    fontWeight: '700'
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 8
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  dateText: {
    fontWeight: '600'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8
  },
  iconButton: {
    padding: 8,
    borderRadius: 10
  },
  title: {
    fontWeight: '700',
    lineHeight: 22
  },
  preacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  preacherText: {
    fontWeight: '500'
  },
  summaryText: {
    lineHeight: 19
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1
  },
  tagText: {
    fontWeight: '600'
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },
  loadingLabel: {
    fontWeight: '500'
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 10
  },
  emptyTitle: {
    fontWeight: '700'
  },
  emptySubtitle: {
    textAlign: 'center'
  }
});
