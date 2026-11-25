export type SupportedLanguage = 'pt' | 'en' | 'es' | 'fr' | 'sw' | 'ts';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  speechLocale: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'pt', name: 'Português', nativeName: 'Português (Brasil & Moçambique)', flag: '🇧🇷🇲🇿', speechLocale: 'pt-BR' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸🇬🇧', speechLocale: 'en-US' },
  { code: 'es', name: 'Español', nativeName: 'Español', flag: '🇪🇸', speechLocale: 'es-ES' },
  { code: 'fr', name: 'Français', nativeName: 'Français (Afrique & Monde)', flag: '🇫🇷🇨🇩', speechLocale: 'fr-FR' },
  { code: 'sw', name: 'Kiswahili', nativeName: 'Kiswahili', flag: '🇹🇿🇰🇪', speechLocale: 'sw-KE' },
  { code: 'ts', name: 'Changana', nativeName: 'Changana / Xitsonga', flag: '🇲🇿🇿🇦', speechLocale: 'pt-MZ' }
];

export interface TranslationSchema {
  common: {
    appName: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    loading: string;
    search: string;
    searchPlaceholder: string;
    confirm: string;
    error: string;
    success: string;
    filter: string;
    all: string;
    select: string;
    actions: string;
    newButton: string;
    active: string;
    refresh: string;
    noRecordsFound: string;
    showingRecords: string; // e.g. "Exibindo {start}-{end} de {total} registros"
  };
  tabs: {
    worships: string;
    worshipsSubtitle: string;
    live: string;
    liveSubtitle: string;
    book: string;
    bookSubtitle: string;
    calendar: string;
    calendarSubtitle: string;
    accessibility: string;
    accessibilitySubtitle: string;
  };
  bookTab: {
    holyBible: string;
    worshipBook: string;
    bibleDescription: string;
    worshipDescription: string;
    chapterOf: string; // "Capítulo {current} de {total}"
    pageOf: string; // "Página {current} de {total}"
    readAloud: string;
    stopAudio: string;
    teachingSummary: string;
    noTranscript: string;
    chapterNotes: string; // "Anotações deste Capítulo ({count})"
    prevPage: string;
    nextPage: string;
    translatingContent: string;
  };
  bible: {
    version: string;
    selectVersion: string;
    book: string;
    selectBook: string;
    chapter: string;
    selectChapter: string;
    verse: string;
    oldTestament: string;
    newTestament: string;
    highlight: string;
    removeHighlight: string;
    addNote: string;
    editNote: string;
    notePlaceholder: string;
    saveNote: string;
    myNotes: string;
    myHighlights: string;
    noNotesYet: string;
    listenChapter: string;
    listenBibleContinuous: string;
    stopAudio: string;
    playingAudio: string;
    speed: string;
    jumpToVerse: string;
    verseCopied: string;
    downloadMoreVersions: string;
    installedVersions: string;
    availableForDownload: string;
    downloading: string;
    downloaded: string;
    shareVerse: string;
    highlightedVerseTag: string;
    offlineTranslatorBanner: string;
    downloadOfflineTranslator: string;
  };
  worship: {
    title: string;
    preacher: string;
    date: string;
    summary: string;
    fullTranscript: string;
    tags: string;
    saveWorship: string;
    editWorship: string;
    deleteWorship: string;
    worshipDetails: string;
    noWorships: string;
    addWorship: string;
    filterByTag: string;
    datePlaceholder: string;
    confirmDeleteTitle: string;
    confirmDeleteMessage: string;
    emptySubtitle: string;
    searchPlaceholder: string;
    loadingRecords: string;
    registerWorship: string;
    saveChanges: string;
    dictateByVoice: string;
    listeningStop: string;
    micActiveBanner: string;
    titlePlaceholder: string;
    preacherPlaceholder: string;
    tagsPlaceholder: string;
    summaryPlaceholder: string;
    transcriptPlaceholder: string;
    requiredField: string;
    updatedSuccess: string;
    createdSuccess: string;
    listenSummary: string;
    translatingServices: string;
  };
  calendar: {
    title: string;
    subtitle: string;
    weekDays: [string, string, string, string, string, string, string];
    servicesOnDate: string; // "Cultos em {date} ({count})"
    noServicesOnDate: string;
    dateLocale: string;
  };
  live: {
    startTranscription: string;
    stopTranscription: string;
    listening: string;
    paused: string;
    offlineMode: string;
    detectedVerses: string;
    transcriptPlaceholder: string;
    saveDraft: string;
    finishWorship: string;
    speechLanguage: string;
    changeSpeechLanguage: string;
  };
  accessibility: {
    title: string;
    subtitle: string;
    language: string;
    selectLanguage: string;
    fontSize: string;
    fontSizeDescription: string;
    fontPreviewLabel: string;
    fontPreviewVerse: string;
    fontOptions: {
      normal: string;
      medium: string;
      large: string;
      extraLarge: string;
      max: string;
    };
    colorBlindness: string;
    colorBlindnessDescription: string;
    colorBlindnessNone: string;
    colorBlindnessNoneDesc: string;
    protanopia: string;
    protanopiaDesc: string;
    deuteranopia: string;
    deuteranopiaDesc: string;
    tritanopia: string;
    tritanopiaDesc: string;
    highContrast: string;
    highContrastDesc: string;
    ttsSettings: string;
    ttsDescription: string;
    ttsHumanGuideTitle: string;
    ttsHumanGuideText: string;
    ttsOpenSettings: string;
    ttsOpenPlayStore: string;
    ttsAvailableVoices: string;
    ttsActiveVoice: string;
    ttsSelectVoiceBtn: string;
    ttsPlaying: string;
    ttsNoVoices: string;
    ttsDemoPhrase: string;
    ttsSpeed: string;
    ttsPitch: string;
    selectVoice: string;
    testVoice: string;
    hapticFeedback: string;
    deafSectionTitle: string;
    librasSupport: string;
    librasDescription: string;
    librasActivePreview: string;
    speakForMeTitle: string;
    speakForMe: string;
    speakForMeDescription: string;
    speakForMeHeader: string;
    speakForMePlaceholder: string;
    quickSpeechCards: [string, string, string, string];
  };
}
