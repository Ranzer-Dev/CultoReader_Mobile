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
  { code: 'en', name: 'Inglês', nativeName: 'English', flag: '🇺🇸🇬🇧', speechLocale: 'en-US' },
  { code: 'es', name: 'Espanhol', nativeName: 'Español', flag: '🇪🇸', speechLocale: 'es-ES' },
  { code: 'fr', name: 'Francês', nativeName: 'Français (Afrique & Monde)', flag: '🇫🇷', speechLocale: 'fr-FR' },
  { code: 'sw', name: 'Suaíli', nativeName: 'Kiswahili', flag: '🇹🇿🇰🇪', speechLocale: 'sw-KE' },
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
    colorBlindness: string;
    colorBlindnessNone: string;
    protanopia: string;
    deuteranopia: string;
    tritanopia: string;
    highContrast: string;
    ttsSettings: string;
    ttsSpeed: string;
    ttsPitch: string;
    selectVoice: string;
    testVoice: string;
    hapticFeedback: string;
    librasSupport: string;
    speakForMe: string;
  };
}
