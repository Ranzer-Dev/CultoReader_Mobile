import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Share,
  Alert
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Volume2,
  VolumeX,
  Highlighter,
  FileText,
  Check,
  Search,
  X,
  Play,
  Pause,
  Square,
  Bookmark,
  Share2,
  Trash2,
  Sparkles
} from 'lucide-react-native';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useLanguage } from '../../i18n';
import { BibleManager } from '../../services/bible/BibleManager';
import { CanonicalBookInfo, CANONICAL_BOOKS } from '../../services/bible/BibleBooksData';
import { BibleNotesRepository } from '../../database/repositories/BibleNotesRepository';
import { BibleHighlight, BibleNote } from '../../types';

interface BibleReaderProps {
  initialBook?: string;
  initialChapter?: number;
  initialVerse?: number;
}

export const HIGHLIGHT_COLORS = [
  { name: 'Amarelo', hex: '#FEF08A', darkHex: '#854D0E' },
  { name: 'Verde', hex: '#BBF7D0', darkHex: '#166534' },
  { name: 'Azul', hex: '#BAE6FD', darkHex: '#075985' },
  { name: 'Rosa', hex: '#FBCFE8', darkHex: '#9D174D' },
  { name: 'Laranja', hex: '#FED7AA', darkHex: '#9A3412' }
];

export const BibleReader: React.FC<BibleReaderProps> = ({
  initialBook,
  initialChapter,
  initialVerse
}) => {
  const { colors, scaledFontSize, speakText, stopSpeaking } = useAccessibility();
  const { t, language } = useLanguage();

  const [version, setVersion] = useState<string>('NVI');
  const [selectedBook, setSelectedBook] = useState<CanonicalBookInfo>(() => {
    if (initialBook) {
      const found = BibleManager.findBookInfo(initialBook);
      if (found) return found;
    }
    // Padrão Salmos (ID 19)
    return CANONICAL_BOOKS[18] || CANONICAL_BOOKS[0];
  });
  const [selectedChapter, setSelectedChapter] = useState<number>(initialChapter || 1);
  const [verses, setVerses] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Grifos e Anotações
  const [highlights, setHighlights] = useState<Map<number, string>>(new Map());
  const [notes, setNotes] = useState<Map<number, BibleNote>>(new Map());
  const [selectedVerseAction, setSelectedVerseAction] = useState<{ num: number; text: string } | null>(null);

  // Modal de Anotação Individual
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [editingNoteVerseNum, setEditingNoteVerseNum] = useState<number | null>(null);

  // Modal "Minhas Anotações & Grifos"
  const [myNotesModalVisible, setMyNotesModalVisible] = useState(false);
  const [allUserNotes, setAllUserNotes] = useState<BibleNote[]>([]);
  const [allUserHighlights, setAllUserHighlights] = useState<BibleHighlight[]>([]);

  // Modais de Seleção
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [testamentTab, setTestamentTab] = useState<'OT' | 'NT'>('OT');
  const [bookSearchQuery, setBookSearchQuery] = useState('');

  // Áudio TTS Contínuo
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentSpokenVerse, setCurrentSpokenVerse] = useState<number | null>(null);
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0);
  const audioStopRequestedRef = useRef<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Carregar Versículos, Grifos e Anotações do Capítulo Atual
  const loadChapter = useCallback(async (vCode: string, book: CanonicalBookInfo, chap: number) => {
    setLoading(true);
    try {
      const [resultVerses, dbHighlights, dbNotes] = await Promise.all([
        BibleManager.getChapterVerses(vCode, book.names.pt, chap),
        BibleNotesRepository.getHighlights(vCode, book.names.pt, chap),
        BibleNotesRepository.getNotes(vCode, book.names.pt, chap)
      ]);

      setVerses(resultVerses);

      const hlMap = new Map<number, string>();
      for (const hl of dbHighlights) {
        hlMap.set(hl.verse, hl.color_hex);
      }
      setHighlights(hlMap);

      const noteMap = new Map<number, BibleNote>();
      for (const n of dbNotes) {
        noteMap.set(n.verse, n);
      }
      setNotes(noteMap);
    } catch (err) {
      console.warn('Erro ao carregar dados do capítulo:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChapter(version, selectedBook, selectedChapter);
    stopAudio();
  }, [version, selectedBook, selectedChapter, loadChapter]);

  // Navegação de Capítulos
  const handleNextChapter = () => {
    if (selectedChapter < selectedBook.chaptersCount) {
      setSelectedChapter(prev => prev + 1);
    } else {
      const nextBookIndex = CANONICAL_BOOKS.findIndex(b => b.id === selectedBook.id) + 1;
      if (nextBookIndex < CANONICAL_BOOKS.length) {
        setSelectedBook(CANONICAL_BOOKS[nextBookIndex]);
        setSelectedChapter(1);
      }
    }
  };

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(prev => prev - 1);
    } else {
      const prevBookIndex = CANONICAL_BOOKS.findIndex(b => b.id === selectedBook.id) - 1;
      if (prevBookIndex >= 0) {
        const prevBook = CANONICAL_BOOKS[prevBookIndex];
        setSelectedBook(prevBook);
        setSelectedChapter(prevBook.chaptersCount);
      }
    }
  };

  // Áudio TTS Versículo a Versículo com Destaque e Leitura Contínua
  const stopAudio = async () => {
    audioStopRequestedRef.current = true;
    setIsPlayingAudio(false);
    setCurrentSpokenVerse(null);
    await stopSpeaking();
  };

  const startAudioReading = async (startFromVerse: number = 1) => {
    if (verses.length === 0) return;
    audioStopRequestedRef.current = false;
    setIsPlayingAudio(true);

    for (let i = startFromVerse - 1; i < verses.length; i++) {
      if (audioStopRequestedRef.current) break;
      const verseNum = i + 1;
      const verseText = verses[i];
      setCurrentSpokenVerse(verseNum);

      const phraseToSpeak = `${verseNum}. ${verseText}`;
      const versionMeta = BibleManager.getVersionMeta(version);
      const vLang = versionMeta?.language || 'pt';
      const speechLang = vLang === 'en' ? 'en-US' : vLang === 'es' ? 'es-ES' : vLang === 'fr' ? 'fr-FR' : 'pt-BR';
      await speakText(phraseToSpeak, { rate: audioSpeed, language: speechLang });

      // Pausa natural entre versículos
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    if (!audioStopRequestedRef.current) {
      // Se terminou o capítulo, avança automaticamente para o próximo capítulo ("ouvir a Bíblia inteira")
      if (selectedChapter < selectedBook.chaptersCount) {
        setSelectedChapter(prev => prev + 1);
        setTimeout(() => {
          if (!audioStopRequestedRef.current) {
            startAudioReading(1);
          }
        }, 1000);
      } else {
        setIsPlayingAudio(false);
        setCurrentSpokenVerse(null);
      }
    }
  };

  // Manipulação de Grifo
  const handleApplyHighlight = async (colorHex: string) => {
    if (!selectedVerseAction) return;
    const vNum = selectedVerseAction.num;
    await BibleNotesRepository.setHighlight(version, selectedBook.names.pt, selectedChapter, vNum, colorHex);
    setHighlights(prev => {
      const copy = new Map(prev);
      copy.set(vNum, colorHex);
      return copy;
    });
    setSelectedVerseAction(null);
  };

  const handleRemoveHighlight = async () => {
    if (!selectedVerseAction) return;
    const vNum = selectedVerseAction.num;
    await BibleNotesRepository.removeHighlight(version, selectedBook.names.pt, selectedChapter, vNum);
    setHighlights(prev => {
      const copy = new Map(prev);
      copy.delete(vNum);
      return copy;
    });
    setSelectedVerseAction(null);
  };

  // Manipulação de Anotação
  const handleOpenNoteModal = (verseNum: number) => {
    const existing = notes.get(verseNum);
    setEditingNoteVerseNum(verseNum);
    setEditingNoteText(existing ? existing.note_text : '');
    setSelectedVerseAction(null);
    setNoteModalVisible(true);
  };

  const handleSaveNote = async () => {
    if (!editingNoteVerseNum || !editingNoteText.trim()) return;
    const saved = await BibleNotesRepository.saveNote(
      version,
      selectedBook.names.pt,
      selectedChapter,
      editingNoteVerseNum,
      editingNoteText.trim()
    );
    setNotes(prev => {
      const copy = new Map(prev);
      copy.set(editingNoteVerseNum, saved);
      return copy;
    });
    setNoteModalVisible(false);
  };

  const handleDeleteNote = async (verseNum: number) => {
    const existing = notes.get(verseNum);
    if (existing) {
      await BibleNotesRepository.deleteNote(existing.id);
      setNotes(prev => {
        const copy = new Map(prev);
        copy.delete(verseNum);
        return copy;
      });
    }
    setNoteModalVisible(false);
  };

  // Carregar todos os grifos/anotações do usuário
  const handleOpenMyNotesModal = async () => {
    const [allNotes, allHl] = await Promise.all([
      BibleNotesRepository.getAllNotes(),
      BibleNotesRepository.getAllHighlights()
    ]);
    setAllUserNotes(allNotes);
    setAllUserHighlights(allHl);
    setMyNotesModalVisible(true);
  };

  const handleJumpToLocation = (bookName: string, chap: number, verseNum?: number) => {
    const book = BibleManager.findBookInfo(bookName);
    if (book) {
      setSelectedBook(book);
      setSelectedChapter(chap);
      setMyNotesModalVisible(false);
    }
  };

  const bookDisplayName = BibleManager.getBookDisplayName(selectedBook, language);
  const versionMeta = BibleManager.getVersionMeta(version);

  const filteredBooks = CANONICAL_BOOKS.filter(b => {
    const matchesTestament = b.testament === testamentTab;
    if (!bookSearchQuery.trim()) return matchesTestament;
    const q = bookSearchQuery.toLowerCase();
    const nameInLang = BibleManager.getBookDisplayName(b, language).toLowerCase();
    const nameInPt = b.names.pt.toLowerCase();
    return matchesTestament && (nameInLang.includes(q) || nameInPt.includes(q) || b.abbrev.includes(q));
  });

  return (
    <View style={styles.container}>
      {/* Top Bar do Leitor da Bíblia */}
      <View style={[styles.topBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        {/* Seletor de Livro e Capítulo */}
        <TouchableOpacity
          style={[styles.selectorPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setBookModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t.bible.selectBook}
        >
          <BookOpen size={scaledFontSize(16)} color={colors.primary} />
          <Text style={[styles.selectorPillText, { color: colors.text, fontSize: scaledFontSize(14) }]}>
            {bookDisplayName} {selectedChapter}
          </Text>
          <Text style={[styles.caret, { color: colors.textMuted }]}>▾</Text>
        </TouchableOpacity>

        {/* Seletor de Versão Bíblica */}
        <TouchableOpacity
          style={[styles.versionPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setVersionModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t.bible.selectVersion}
        >
          <Text style={[styles.versionFlag, { fontSize: scaledFontSize(13) }]}>
            {versionMeta.flag}
          </Text>
          <Text style={[styles.versionCodeText, { color: colors.primary, fontSize: scaledFontSize(13) }]}>
            {versionMeta.shortName}
          </Text>
          <Text style={[styles.caret, { color: colors.textMuted }]}>▾</Text>
        </TouchableOpacity>

        {/* Botão Meus Grifos & Anotações */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleOpenMyNotesModal}
          accessibilityRole="button"
          accessibilityLabel={t.bible.myNotes}
        >
          <Bookmark size={scaledFontSize(16)} color={colors.accent} />
        </TouchableOpacity>

        {/* Botão de Áudio Play/Stop */}
        <TouchableOpacity
          style={[
            styles.audioButton,
            { backgroundColor: isPlayingAudio ? colors.danger : colors.primary }
          ]}
          onPress={() => {
            if (isPlayingAudio) {
              stopAudio();
            } else {
              startAudioReading(1);
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={isPlayingAudio ? t.bible.stopAudio : t.bible.listenChapter}
        >
          {isPlayingAudio ? (
            <VolumeX size={scaledFontSize(16)} color="#FFFFFF" />
          ) : (
            <Volume2 size={scaledFontSize(16)} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Barra de Player de Áudio Ativo */}
      {isPlayingAudio && (
        <View style={[styles.audioPlayerBar, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
          <View style={styles.audioPlayerInfo}>
            <View style={styles.pulseDot} />
            <Text style={[styles.audioPlayerText, { color: colors.text, fontSize: scaledFontSize(12) }]}>
              {bookDisplayName} {selectedChapter}:{currentSpokenVerse || 1} ({t.bible.playingAudio})
            </Text>
          </View>

          <View style={styles.audioPlayerControls}>
            <TouchableOpacity
              style={[styles.audioSpeedButton, { borderColor: colors.border }]}
              onPress={() => {
                const nextSpeed = audioSpeed === 1.0 ? 1.25 : audioSpeed === 1.25 ? 1.5 : audioSpeed === 1.5 ? 0.75 : 1.0;
                setAudioSpeed(nextSpeed);
              }}
            >
              <Text style={[styles.audioSpeedText, { color: colors.primary, fontSize: scaledFontSize(11) }]}>
                {audioSpeed}x
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.audioStopPill, { backgroundColor: colors.danger }]}
              onPress={stopAudio}
            >
              <Square size={scaledFontSize(12)} color="#FFFFFF" />
              <Text style={styles.audioStopText}>{t.common.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Corpo da Leitura dos Versículos */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingLabel, { color: colors.textSecondary, fontSize: scaledFontSize(14) }]}>
            {t.common.loading}
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.versesScroll}
          contentContainerStyle={styles.versesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Título do Livro & Capítulo */}
          <View style={styles.chapterTitleBox}>
            <Text style={[styles.chapterTitle, { color: colors.text, fontSize: scaledFontSize(20) }]}>
              {bookDisplayName}
            </Text>
            <Text style={[styles.chapterSubtitle, { color: colors.textSecondary, fontSize: scaledFontSize(14) }]}>
              {t.bible.chapter} {selectedChapter} • {versionMeta.name}
            </Text>
          </View>

          {/* Lista de Versículos com Destaque e Anotações */}
          {verses.map((text, idx) => {
            const verseNum = idx + 1;
            const isSpoken = currentSpokenVerse === verseNum;
            const highlightColor = highlights.get(verseNum);
            const verseNote = notes.get(verseNum);

            return (
              <TouchableOpacity
                key={verseNum}
                activeOpacity={0.7}
                style={[
                  styles.verseRow,
                  highlightColor && {
                    backgroundColor: `${highlightColor}33`,
                    borderRadius: 8,
                    paddingHorizontal: 6
                  },
                  isSpoken && {
                    backgroundColor: colors.surfaceElevated,
                    borderLeftColor: colors.primary,
                    borderLeftWidth: 3,
                    paddingLeft: 8
                  }
                ]}
                onPress={() => setSelectedVerseAction({ num: verseNum, text })}
              >
                <Text
                  style={[
                    styles.verseNumber,
                    {
                      color: isSpoken ? colors.primary : highlightColor || colors.textMuted,
                      fontSize: scaledFontSize(12)
                    }
                  ]}
                >
                  {verseNum}
                </Text>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.verseText,
                      {
                        color: isSpoken ? colors.text : colors.textSecondary,
                        fontSize: scaledFontSize(16),
                        lineHeight: scaledFontSize(26)
                      }
                    ]}
                  >
                    {text}
                  </Text>

                  {/* Prévia da Anotação se existir */}
                  {verseNote && (
                    <TouchableOpacity
                      style={[styles.noteSnippetBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                      onPress={() => handleOpenNoteModal(verseNum)}
                    >
                      <Bookmark size={scaledFontSize(12)} color={colors.accent} />
                      <Text style={[styles.noteSnippetText, { color: colors.text, fontSize: scaledFontSize(12) }]} numberOfLines={1}>
                        {verseNote.note_text}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Rodapé de Navegação de Capítulos */}
          <View style={[styles.footerNav, { borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.navButton,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border }
              ]}
              onPress={handlePrevChapter}
            >
              <ChevronLeft size={scaledFontSize(18)} color={colors.text} />
              <Text style={[styles.navButtonText, { color: colors.text, fontSize: scaledFontSize(13) }]}>
                {t.common.previous}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.currentChapterBadge, { color: colors.textMuted, fontSize: scaledFontSize(12) }]}>
              {selectedChapter} / {selectedBook.chaptersCount}
            </Text>

            <TouchableOpacity
              style={[
                styles.navButton,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border }
              ]}
              onPress={handleNextChapter}
            >
              <Text style={[styles.navButtonText, { color: colors.text, fontSize: scaledFontSize(13) }]}>
                {t.common.next}
              </Text>
              <ChevronRight size={scaledFontSize(18)} color={colors.text} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Modal: Ações do Versículo (Grifar, Anotar, Ouvir, Compartilhar) */}
      <Modal
        visible={!!selectedVerseAction}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedVerseAction(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: scaledFontSize(16) }]}>
                {bookDisplayName} {selectedChapter}:{selectedVerseAction?.num}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedVerseAction(null)}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.actionVerseQuote, { color: colors.textSecondary, fontSize: scaledFontSize(14) }]}>
              "{selectedVerseAction?.text}"
            </Text>

            {/* Paleta de Cores para Grifo */}
            <Text style={[styles.actionSectionLabel, { color: colors.textMuted, fontSize: scaledFontSize(12) }]}>
              {t.bible.highlight}:
            </Text>
            <View style={styles.colorPaletteRow}>
              {HIGHLIGHT_COLORS.map(c => (
                <TouchableOpacity
                  key={c.hex}
                  style={[styles.colorCircle, { backgroundColor: c.hex }]}
                  onPress={() => handleApplyHighlight(c.hex)}
                />
              ))}
              <TouchableOpacity
                style={[styles.colorCircleRemove, { borderColor: colors.border }]}
                onPress={handleRemoveHighlight}
              >
                <X size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>

            {/* Botões de Ação */}
            <View style={styles.actionButtonsList}>
              <TouchableOpacity
                style={[styles.actionOptionBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                onPress={() => {
                  if (selectedVerseAction) {
                    handleOpenNoteModal(selectedVerseAction.num);
                  }
                }}
              >
                <FileText size={scaledFontSize(18)} color={colors.accent} />
                <Text style={[styles.actionOptionBtnText, { color: colors.text, fontSize: scaledFontSize(14) }]}>
                  {notes.has(selectedVerseAction?.num || 0) ? t.bible.editNote : t.bible.addNote}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionOptionBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                onPress={() => {
                  const vNum = selectedVerseAction?.num || 1;
                  setSelectedVerseAction(null);
                  startAudioReading(vNum);
                }}
              >
                <Play size={scaledFontSize(18)} color={colors.primary} />
                <Text style={[styles.actionOptionBtnText, { color: colors.text, fontSize: scaledFontSize(14) }]}>
                  {t.bible.listenChapter} (v. {selectedVerseAction?.num})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionOptionBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                onPress={() => {
                  if (selectedVerseAction) {
                    Share.share({
                      message: `${bookDisplayName} ${selectedChapter}:${selectedVerseAction.num} - "${selectedVerseAction.text}" (${version})`
                    });
                    setSelectedVerseAction(null);
                  }
                }}
              >
                <Share2 size={scaledFontSize(18)} color={colors.secondary} />
                <Text style={[styles.actionOptionBtnText, { color: colors.text, fontSize: scaledFontSize(14) }]}>
                  Compartilhar Versículo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Escrever Anotação */}
      <Modal
        visible={noteModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: scaledFontSize(16) }]}>
                {t.bible.addNote} - {bookDisplayName} {selectedChapter}:{editingNoteVerseNum}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setNoteModalVisible(false)}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.noteInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                  fontSize: scaledFontSize(14)
                }
              ]}
              multiline
              numberOfLines={4}
              placeholder={t.bible.notePlaceholder}
              placeholderTextColor={colors.textMuted}
              value={editingNoteText}
              onChangeText={setEditingNoteText}
            />

            <View style={styles.noteModalButtons}>
              {editingNoteVerseNum && notes.has(editingNoteVerseNum) && (
                <TouchableOpacity
                  style={[styles.deleteNoteBtn, { borderColor: colors.danger }]}
                  onPress={() => handleDeleteNote(editingNoteVerseNum)}
                >
                  <Trash2 size={16} color={colors.danger} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.saveNoteBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveNote}
              >
                <Check size={16} color="#FFFFFF" />
                <Text style={styles.saveNoteBtnText}>{t.bible.saveNote}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: "Meus Grifos & Anotações" */}
      <Modal
        visible={myNotesModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setMyNotesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: scaledFontSize(18) }]}>
                {t.bible.myNotes} & {t.bible.myHighlights}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setMyNotesModalVisible(false)}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {allUserNotes.length === 0 && allUserHighlights.length === 0 ? (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Bookmark size={32} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, marginTop: 8, textAlign: 'center' }}>
                    {t.bible.noNotesYet}
                  </Text>
                </View>
              ) : (
                <>
                  {allUserNotes.map(n => (
                    <TouchableOpacity
                      key={`note-${n.id}`}
                      style={[styles.userNoteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => handleJumpToLocation(n.book, n.chapter, n.verse)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.userNoteLoc, { color: colors.primary, fontSize: scaledFontSize(13) }]}>
                          {n.book} {n.chapter}:{n.verse}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: scaledFontSize(11) }}>
                          {n.created_at?.slice(0, 10)}
                        </Text>
                      </View>
                      <Text style={[styles.userNoteBody, { color: colors.text, fontSize: scaledFontSize(14) }]}>
                        {n.note_text}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {allUserHighlights.map(h => (
                    <TouchableOpacity
                      key={`hl-${h.id}`}
                      style={[styles.userHlCard, { backgroundColor: `${h.color_hex}22`, borderColor: h.color_hex }]}
                      onPress={() => handleJumpToLocation(h.book, h.chapter, h.verse)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={[styles.colorDot, { backgroundColor: h.color_hex }]} />
                        <Text style={[styles.userNoteLoc, { color: colors.text, fontSize: scaledFontSize(13) }]}>
                          {h.book} {h.chapter}:{h.verse} (Versículo Grifado)
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Seletor de Livro e Capítulo */}
      <Modal
        visible={bookModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBookModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: scaledFontSize(18) }]}>
                {t.bible.selectBook}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setBookModalVisible(false)}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.testamentTabs, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.testamentTab,
                  testamentTab === 'OT' && { backgroundColor: colors.primary }
                ]}
                onPress={() => setTestamentTab('OT')}
              >
                <Text
                  style={[
                    styles.testamentTabText,
                    { color: testamentTab === 'OT' ? colors.primaryText : colors.textSecondary, fontSize: scaledFontSize(13) }
                  ]}
                >
                  {t.bible.oldTestament} (39)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.testamentTab,
                  testamentTab === 'NT' && { backgroundColor: colors.primary }
                ]}
                onPress={() => setTestamentTab('NT')}
              >
                <Text
                  style={[
                    styles.testamentTabText,
                    { color: testamentTab === 'NT' ? colors.primaryText : colors.textSecondary, fontSize: scaledFontSize(13) }
                  ]}
                >
                  {t.bible.newTestament} (27)
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Search size={scaledFontSize(16)} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text, fontSize: scaledFontSize(14) }]}
                placeholder={t.common.searchPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={bookSearchQuery}
                onChangeText={setBookSearchQuery}
              />
              {bookSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setBookSearchQuery('')}>
                  <X size={scaledFontSize(16)} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.bookListScroll} showsVerticalScrollIndicator={false}>
              {filteredBooks.map(b => {
                const isSelected = b.id === selectedBook.id;
                const bName = BibleManager.getBookDisplayName(b, language);

                return (
                  <View key={b.id} style={styles.bookItemContainer}>
                    <TouchableOpacity
                      style={[
                        styles.bookItemHeader,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        isSelected && { borderColor: colors.primary, backgroundColor: colors.surfaceElevated }
                      ]}
                      onPress={() => {
                        setSelectedBook(b);
                        setSelectedChapter(1);
                      }}
                    >
                      <Text style={[styles.bookItemName, { color: colors.text, fontSize: scaledFontSize(15) }]}>
                        {bName}
                      </Text>
                      <Text style={[styles.bookItemMeta, { color: colors.textMuted, fontSize: scaledFontSize(12) }]}>
                        {b.chaptersCount} {t.bible.chapter.toLowerCase()}s
                      </Text>
                    </TouchableOpacity>

                    {isSelected && (
                      <View style={[styles.chaptersGrid, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                        {Array.from({ length: b.chaptersCount }, (_, i) => i + 1).map(cNum => {
                          const isCurrentChap = selectedChapter === cNum;
                          return (
                            <TouchableOpacity
                              key={cNum}
                              style={[
                                styles.chapterGridPill,
                                { backgroundColor: colors.surface, borderColor: colors.border },
                                isCurrentChap && { backgroundColor: colors.primary, borderColor: colors.primary }
                              ]}
                              onPress={() => {
                                setSelectedChapter(cNum);
                                setBookModalVisible(false);
                              }}
                            >
                              <Text
                                style={[
                                  styles.chapterGridPillText,
                                  { color: isCurrentChap ? colors.primaryText : colors.text, fontSize: scaledFontSize(13) }
                                ]}
                              >
                                {cNum}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Seletor de Versão da Bíblia */}
      <Modal
        visible={versionModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setVersionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: scaledFontSize(18) }]}>
                {t.bible.selectVersion}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setVersionModalVisible(false)}
              >
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginTop: 8 }}>
              <Text style={[styles.versionGroupTitle, { color: colors.textSecondary, fontSize: scaledFontSize(12) }]}>
                {t.bible.installedVersions}
              </Text>

              {BibleManager.getVersions().map(v => {
                const isSelected = version === v.code;
                return (
                  <TouchableOpacity
                    key={v.code}
                    style={[
                      styles.versionCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && { borderColor: colors.primary, backgroundColor: colors.surfaceElevated }
                    ]}
                    onPress={() => {
                      setVersion(v.code);
                      setVersionModalVisible(false);
                    }}
                  >
                    <View style={styles.versionCardLeft}>
                      <Text style={[styles.versionCardFlag, { fontSize: scaledFontSize(22) }]}>
                        {v.flag}
                      </Text>
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.versionCardCode, { color: colors.primary, fontSize: scaledFontSize(14) }]}>
                            {v.shortName}
                          </Text>
                          <Text style={[styles.versionCardLang, { color: colors.textMuted, fontSize: scaledFontSize(11) }]}>
                            • {v.languageName}
                          </Text>
                        </View>
                        <Text style={[styles.versionCardName, { color: colors.text, fontSize: scaledFontSize(14) }]}>
                          {v.name}
                        </Text>
                        <Text style={[styles.versionCardDesc, { color: colors.textSecondary, fontSize: scaledFontSize(12) }]}>
                          {v.description}
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
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8
  },
  selectorPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1
  },
  selectorPillText: {
    fontWeight: '700'
  },
  versionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1
  },
  versionFlag: {
    marginRight: 2
  },
  versionCodeText: {
    fontWeight: '700'
  },
  caret: {
    fontSize: 10
  },
  iconButton: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  audioButton: {
    padding: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  audioPlayerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 2
  },
  audioPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981'
  },
  audioPlayerText: {
    fontWeight: '600'
  },
  audioPlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  audioSpeedButton: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  audioSpeedText: {
    fontWeight: '700'
  },
  audioStopPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  audioStopText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  versesScroll: {
    flex: 1
  },
  versesContent: {
    padding: 16,
    paddingBottom: 40
  },
  chapterTitleBox: {
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  chapterTitle: {
    fontWeight: '800'
  },
  chapterSubtitle: {
    fontWeight: '500',
    marginTop: 2
  },
  verseRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingVertical: 4
  },
  verseNumber: {
    width: 28,
    fontWeight: '700',
    marginTop: 4
  },
  verseText: {
    fontWeight: '400'
  },
  noteSnippetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
    alignSelf: 'flex-start'
  },
  noteSnippetText: {
    fontStyle: 'italic',
    maxWidth: 260
  },
  footerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1
  },
  navButtonText: {
    fontWeight: '600'
  },
  currentChapterBadge: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end'
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    maxHeight: '85%',
    padding: 16
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  modalTitle: {
    fontWeight: '700'
  },
  modalCloseButton: {
    padding: 6
  },
  actionVerseQuote: {
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 20
  },
  actionSectionLabel: {
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6
  },
  colorPaletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)'
  },
  colorCircleRemove: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionButtonsList: {
    gap: 8,
    marginBottom: 8
  },
  actionOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  actionOptionBtnText: {
    fontWeight: '600'
  },
  noteInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    textAlignVertical: 'top',
    height: 100,
    marginBottom: 12
  },
  noteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  deleteNoteBtn: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  saveNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10
  },
  saveNoteBtnText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  userNoteCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 4
  },
  userNoteLoc: {
    fontWeight: '700'
  },
  userNoteBody: {
    fontWeight: '400'
  },
  userHlCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  testamentTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 10
  },
  testamentTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  testamentTabText: {
    fontWeight: '700'
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10
  },
  searchInput: {
    flex: 1,
    padding: 0
  },
  bookListScroll: {
    maxHeight: 380
  },
  bookItemContainer: {
    marginBottom: 8
  },
  bookItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  bookItemName: {
    fontWeight: '700'
  },
  bookItemMeta: {
    fontWeight: '500'
  },
  chaptersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6
  },
  chapterGridPill: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1
  },
  chapterGridPillText: {
    fontWeight: '700'
  },
  versionGroupTitle: {
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5
  },
  versionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10
  },
  versionCardLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1
  },
  versionCardFlag: {
    marginTop: 2
  },
  versionCardCode: {
    fontWeight: '800'
  },
  versionCardLang: {
    fontWeight: '500'
  },
  versionCardName: {
    fontWeight: '700'
  },
  versionCardDesc: {
    fontWeight: '400',
    marginTop: 2
  }
});
