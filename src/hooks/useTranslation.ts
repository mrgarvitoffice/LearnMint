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
    setTranslations(null); // Reset translations on language change

    const loadTranslations = async (lang: string) => {
      try {
        const module = await import(`@/locales/${lang}.json`);
        if (active && module.default && Object.keys(module.default).length > 0) {
          setTranslations(module.default);
          setIsReady(true); // Set ready only after successful load
        } else {
            throw new Error(`Translations for ${lang} are empty or invalid.`);
        }
      } catch (error) {
        console.warn(`Could not load translations for language: ${lang}. Falling back to English.`, error);
        try {
          const fallbackModule = await import(`@/locales/en.json`);
          if (active && fallbackModule.default && Object.keys(fallbackModule.default).length > 0) {
            setTranslations(fallbackModule.default);
            setIsReady(true); // Set ready after successful fallback load
          } else {
            console.error("CRITICAL: Failed to load or parse fallback English translations.", error);
            if (active) {
                setTranslations({}); // Prevent crashes
                setIsReady(true); // Still need to unblock the UI, even if translations are broken
            }
          }
        } catch (fallbackError) {
          console.error("CRITICAL: Failed to load fallback English translations.", fallbackError);
          if (active) {
             setTranslations({});
             setIsReady(true);
          }
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
    // If translations are not ready, return an empty string. The UI components
    // should be showing a loading skeleton based on the `isReady` flag.
    if (!isReady || !translations) {
      return "";
    }
    
    const translation = translations[key];

    // If a specific key is missing from the loaded JSON file, it's a data error.
    // Log a warning for debugging and return the key itself so it's visible in the UI.
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
