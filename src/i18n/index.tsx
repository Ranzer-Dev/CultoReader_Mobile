import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, TranslationSchema, LanguageInfo } from './types';
import { pt } from './locales/pt';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { sw } from './locales/sw';
import { ts } from './locales/ts';
import { getDatabase } from '../database/connection';

const dictionaries: Record<SupportedLanguage, TranslationSchema> = {
  pt,
  en,
  es,
  fr,
  sw,
  ts
};

interface LanguageContextData {
  language: SupportedLanguage;
  languageInfo: LanguageInfo;
  languages: LanguageInfo[];
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: TranslationSchema;
}

const defaultLanguage: SupportedLanguage = 'pt';

const LanguageContext = createContext<LanguageContextData>({
  language: defaultLanguage,
  languageInfo: SUPPORTED_LANGUAGES[0],
  languages: SUPPORTED_LANGUAGES,
  setLanguage: async () => {},
  t: dictionaries[defaultLanguage]
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(defaultLanguage);

  useEffect(() => {
    // Carrega preferência de idioma salva no banco de dados SQLite (tabela criada em migrations.ts)
    const loadStoredLanguage = async () => {
      try {
        const db = await getDatabase();
        const row = await db.getFirstAsync<{ value: string }>(
          `SELECT value FROM app_settings WHERE key = 'app_language';`
        );
        if (row && (row.value in dictionaries)) {
          setLanguageState(row.value as SupportedLanguage);
        }
      } catch (e) {
        console.warn('Erro ao carregar preferência de idioma:', e);
      }
    };
    loadStoredLanguage();
  }, []);

  const setLanguage = async (newLang: SupportedLanguage) => {
    if (newLang in dictionaries) {
      setLanguageState(newLang);
      try {
        const db = await getDatabase();
        await db.runAsync(
          `INSERT OR REPLACE INTO app_settings (key, value) VALUES ('app_language', ?);`,
          [newLang]
        );
      } catch (e) {
        console.warn('Erro ao salvar idioma no banco:', e);
      }
    }
  };

  const activeDict = dictionaries[language] || dictionaries[defaultLanguage];
  const activeInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        languageInfo: activeInfo,
        languages: SUPPORTED_LANGUAGES,
        setLanguage,
        t: activeDict
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextData {
  return useContext(LanguageContext);
}

export { SUPPORTED_LANGUAGES, SupportedLanguage, LanguageInfo };
