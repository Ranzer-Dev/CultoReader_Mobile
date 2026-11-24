export interface WorshipService {
  id: number;
  title: string;
  preacher: string;
  service_date: string; // YYYY-MM-DD
  summary: string;
  full_transcript: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

export type CreateWorshipDTO = Omit<WorshipService, 'id' | 'created_at' | 'updated_at'>;
export type UpdateWorshipDTO = Partial<CreateWorshipDTO>;

export interface WorshipNote {
  id: number;
  worship_id: number;
  selected_text: string;
  note_text: string;
  start_offset?: number;
  end_offset?: number;
  color_tag: string;
  created_at: string;
}

export type CreateWorshipNoteDTO = Omit<WorshipNote, 'id' | 'created_at'>;

export interface BibleVerse {
  id: number;
  version_code: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleHighlight {
  id: number;
  version_code: string;
  book: string;
  chapter: number;
  verse: number;
  color_hex: string;
  created_at?: string;
}

export interface BibleNote {
  id: number;
  version_code: string;
  book: string;
  chapter: number;
  verse: number;
  note_text: string;
  color_tag?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DetectedVerse {
  id?: number;
  worship_id?: number;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end?: number;
  full_text?: string;
  version_code: string;
  raw_match?: string;
  is_chapter_only?: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  date?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type ColorBlindnessType = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'high_contrast';

export interface AccessibilitySettings {
  fontSizeScale: number; // 1.0 a 2.0 (100% a 200%)
  colorBlindness: ColorBlindnessType;
  hapticFeedbackEnabled: boolean;
  librasEnabled: boolean;
  speakForMeEnabled: boolean;
}
