
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

    const loadTranslations = async (lang: string) => {
      setIsReady(false);
      try {
        const module = await import(`@/locales/${lang}.json`);
        // This robust logic handles different ways modules can be structured.
        const translationData = module.default || module;

        if (active && translationData && Object.keys(translationData).length > 0) {
          setTranslations(translationData);
        } else {
          // If the primary language fails, immediately try the fallback.
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
            if (active) setTranslations({}); // Prevent crashes, UI will show keys
          }
        } catch (fallbackError) {
          console.error("CRITICAL: Failed to load fallback English translations.", fallbackError);
          if (active) setTranslations({}); // Prevent crashes
        }
      } finally {
        if (active) {
          setIsReady(true); // Always become ready, even if translations failed (to unblock UI)
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
