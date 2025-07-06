
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

type TFunction = (key: string, options?: { [key: string]: string | number }) => string;

export function useTranslation(): { t: TFunction, isReady: boolean } {
  const { appLanguage } = useSettings();
  const [translations, setTranslations] = useState<Record<string, string> | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    setIsReady(false);

    const loadTranslations = async (lang: string) => {
      try {
        const module = await import(`@/locales/${lang}.json`);
        if (active) {
          setTranslations(module.default);
        }
      } catch (error) {
        console.warn(`Could not load translations for language: ${lang}. Falling back to English.`, error);
        try {
          // Explicitly try to load English as a fallback
          const fallbackModule = await import(`@/locales/en.json`);
          if (active) {
            setTranslations(fallbackModule.default);
          }
        } catch (fallbackError) {
          console.error("CRITICAL: Failed to load fallback English translations.", fallbackError);
          // If even English fails, set to an empty object to prevent crashes
          if (active) {
            setTranslations({});
          }
        }
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    };

    const langCode = appLanguage.split('-')[0];
    loadTranslations(langCode);

    return () => {
      active = false;
    };
  }, [appLanguage]);

  const t: TFunction = useCallback((key, options) => {
    // If not ready, it's better to return an empty string than a broken key
    if (!isReady || !translations) {
      return "";
    }
    
    let translation = translations[key] || key;

    if (options) {
      Object.keys(options).forEach(optionKey => {
        const regex = new RegExp(`{{${optionKey}}}`, 'g');
        translation = translation.replace(regex, String(options[optionKey]));
      });
    }

    return translation;
  }, [translations, isReady]);

  return { t, isReady };
}
