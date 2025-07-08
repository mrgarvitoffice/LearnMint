
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
    setTranslations(null);

    const loadTranslations = async (lang: string) => {
      try {
        const module = await import(`@/locales/${lang}.json`);
        const data = module.default || module;
        if (active && data && Object.keys(data).length > 0) {
          setTranslations(data);
        } else {
          throw new Error(`Translations for ${lang} are empty or invalid.`);
        }
      } catch (error) {
        console.warn(`Could not load translations for language: ${lang}. Falling back to English.`, error);
        try {
          const fallbackModule = await import(`@/locales/en.json`);
          const fallbackData = fallbackModule.default || fallbackModule;
          if (active && fallbackData && Object.keys(fallbackData).length > 0) {
            setTranslations(fallbackData);
          } else {
            console.error("CRITICAL: Failed to load or parse fallback English translations.", error);
            if (active) setTranslations({}); // Prevent crashes
          }
        } catch (fallbackError) {
          console.error("CRITICAL: Failed to load fallback English translations.", fallbackError);
          if (active) setTranslations({});
        }
      } finally {
        if (active) {
            setIsReady(true);
        }
      }
    };

    const langCode = appLanguage.split('-')[0] || 'en';
    loadTranslations(langCode);

    return () => {
      active = false;
    };
  }, [appLanguage]);

  const t: TFunction = useCallback((key, options) => {
    if (!isReady || !translations) {
      return "";
    }
    
    const translation = translations[key];

    if (translation === undefined) {
        console.warn(`Translation key not found: "${key}" for language "${appLanguage}".`);
        return key; 
    }

    let finalTranslation = translation;

    if (options) {
      Object.keys(options).forEach(optionKey => {
        const regex = new RegExp(`{{${optionKey}}}`, 'g');
        finalTranslation = finalTranslation.replace(regex, String(options[optionKey]));
      });
    }

    return finalTranslation;
  }, [translations, isReady, appLanguage]);

  return { t, isReady };
}
